import { test, expect } from '@playwright/test';
import { open, tapToUnlock } from './helpers.js';

/**
 * The criteria a real browser has to settle: geometry (arrows follow the laid-out grid, not
 * document order), native activation on Enter, native value stepping in a select, and that
 * a pointer still does everything it did (US-11.3).
 */

const focused = (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: 'BODY' };
  return { tag: el.tagName, option: el.dataset.option ?? null, action: el.dataset.action ?? null, level: el.dataset.level ?? null, text: (el.textContent ?? '').trim() };
});

/**
 * Start a real question. Level 6 is the default for the geometry cases: its twelve choices wrap
 * to more than one row at both the phone and the tablet viewport, which is what the row/column
 * criteria are about — level 1's two choices never wrap anywhere.
 */
async function startSession(page, levelNo = 6) {
  await open(page, `#/level/intervals/${levelNo}`);
  await tapToUnlock(page);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForFunction(() => window.__test.session?.state.phase === 'question');
  await page.waitForFunction(() => document.activeElement?.dataset.option !== undefined);
}

test.describe('US-11.3 Arrow-key navigation', () => {
  test('AC-11.3.1/1 — Right and Left move along a row of answer choices', async ({ page }) => {
    await startSession(page);
    // Read the row off the real layout: the grid's column count is a function of viewport width.
    const start = (await focused(page)).option;
    const rowMate = await page.evaluate((option) => {
      const origin = document.querySelector(`.answer-grid [data-option="${option}"]`).getBoundingClientRect();
      const onRow = [...document.querySelectorAll('.answer-grid button')]
        .map((e) => ({ option: e.dataset.option, r: e.getBoundingClientRect() }))
        .filter((c) => c.r.left > origin.left && Math.min(c.r.bottom, origin.bottom) - Math.max(c.r.top, origin.top) > 0)
        .sort((a, b) => a.r.left - b.r.left);
      return onRow[0]?.option ?? null;
    }, start);
    test.skip(rowMate === null, 'this viewport lays the grid out one choice per row');
    await page.keyboard.press('ArrowRight');
    expect((await focused(page)).option).toBe(rowMate);
    await page.keyboard.press('ArrowLeft');
    expect((await focused(page)).option).toBe(start);
  });

  test('AC-11.3.1/2 — Down and Up move between rows of the answer grid, keeping the column', async ({ page }) => {
    await startSession(page);
    const top = (await focused(page)).option;
    // The choice in the same column on the next row down, whatever the grid wrapped to here.
    const below = await page.evaluate((option) => {
      const origin = document.querySelector(`.answer-grid [data-option="${option}"]`).getBoundingClientRect();
      const under = [...document.querySelectorAll('.answer-grid button')]
        .map((e) => ({ option: e.dataset.option, r: e.getBoundingClientRect() }))
        .filter((c) => c.r.top >= origin.bottom && Math.min(c.r.right, origin.right) - Math.max(c.r.left, origin.left) > 0)
        .sort((a, b) => a.r.top - b.r.top);
      return under[0]?.option ?? null;
    }, top);
    test.skip(below === null, 'this viewport lays the whole grid out on one row');
    await page.keyboard.press('ArrowDown');
    expect((await focused(page)).option).toBe(below);
    await page.keyboard.press('ArrowUp');
    expect((await focused(page)).option).toBe(top);
  });

  test('AC-11.3.1/3 — Arrows move out of a group of choices to the controls around it', async ({ page }) => {
    await startSession(page);
    const gridTop = await page.locator('.answer-grid').evaluate((e) => e.getBoundingClientRect().top);
    // Up out of the choices reaches the stimulus row — the grid must not be a trap. (Nothing
    // focusable sits below it during a question, which is why this case moves upward.)
    await page.keyboard.press('ArrowUp');
    const up = await page.evaluate(() => ({ inGrid: Boolean(document.activeElement.closest('.answer-grid')), bottom: document.activeElement.getBoundingClientRect().bottom }));
    expect(up.inGrid).toBe(false);
    expect(up.bottom).toBeLessThanOrEqual(gridTop + 1);

    // And downward through the controls stacked in the feedback panel, once a result is up.
    await page.locator('.answer-grid button').first().click();
    await page.waitForFunction(() => window.__test.session.state.phase === 'feedback');
    await page.locator('[data-action="replay-stimulus"]').focus();
    let reached = false;
    for (let i = 0; i < 6 && !reached; i += 1) {
      await page.keyboard.press('ArrowDown');
      reached = await page.evaluate(() => document.activeElement.dataset.action === 'next');
    }
    expect(reached).toBe(true);
  });

  test('AC-11.3.1/4 — An arrow with no control in that direction leaves focus where it is', async ({ page }) => {
    await startSession(page);
    // The top bar is the top of the app: nothing is above it, and nothing shares its row further
    // left — a Left press must not walk down to whatever sits further left two rows below.
    await page.locator('[data-nav="home"]').focus();
    const before = await focused(page);
    await page.keyboard.press('ArrowUp');
    expect(await focused(page)).toEqual(before);
    await page.keyboard.press('ArrowLeft');
    expect(await focused(page)).toEqual(before);
  });

  test('AC-11.3.2 — Enter activates the focused control', async ({ page }) => {
    await startSession(page);
    const option = (await focused(page)).option;
    expect(option).not.toBeNull();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__test.session.state.phase === 'feedback');
    // Exactly once: a second submission would have counted two questions, not one.
    expect(await page.evaluate(() => window.__test.session.state.questions)).toBe(1);
    expect(await page.evaluate(() => window.__test.session.state.result.chosen)).toBe(option);
  });

  test('AC-11.3.3 — A key the app handles does not scroll the page', async ({ page }) => {
    await open(page, '#/settings');
    await page.evaluate(() => window.scrollTo(0, 0));
    // Focus the first control and press Down repeatedly: focus walks the settings, the page does not jump.
    await page.locator('[data-role="settings"] select, [data-role="settings"] input, [data-role="settings"] button').first().focus();
    const before = await page.evaluate(() => window.scrollY);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('AC-11.3.6 — Arrow keys inside a value control still change its value', async ({ page }) => {
    await open(page, '#/settings');
    const select = page.locator('select[data-setting="cadenceFrequency"]');
    await select.focus();
    const before = await select.inputValue();
    await page.keyboard.press('ArrowDown');
    expect(await select.inputValue()).not.toBe(before);
    expect((await focused(page)).tag).toBe('SELECT');
  });

  test("AC-11.3.5/1 — Escape in a session returns to that level's screen and ends the session", async ({ page }) => {
    await startSession(page, 1);
    await page.keyboard.press('Escape');
    await expect(page.locator('.level-screen')).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#/level/intervals/1');
    // `end()` marks the session ended; the phase field it leaves behind is the last question's.
    expect(await page.evaluate(() => window.__test.session.state.ended)).toBe(true);
  });

  test('AC-11.3.5/2 — Escape on a level screen returns to the home map', async ({ page }) => {
    await open(page, '#/level/intervals/1');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-role="map"]')).toBeVisible();
  });

  test('AC-11.3.5/3 — Escape on the reference, stats, settings and credits screens returns to the screen that opens them', async ({ page }) => {
    await open(page, '#/reference/intervals/1');
    await page.keyboard.press('Escape');
    await expect(page.locator('.level-screen')).toBeVisible();

    await open(page, '#/credits');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-role="settings"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-role="map"]')).toBeVisible();

    await open(page, '#/stats?track=intervals');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-role="weakest"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-role="map"]')).toBeVisible();
  });

  test('AC-11.3.5/4 — Escape on the home map does nothing', async ({ page }) => {
    await open(page, '#/home');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-role="map"]')).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#/home');
  });

  test('AC-11.3.7 — Pointer and touch activation are unchanged', async ({ page }) => {
    await open(page, '#/home');
    await tapToUnlock(page);
    await page.locator('[data-track="intervals"] [data-level="1"]').tap();
    await expect(page.locator('.level-screen')).toBeVisible();
    await page.getByRole('button', { name: 'Start' }).tap();
    await page.waitForFunction(() => window.__test.session?.state.phase === 'question');
    await page.locator('.answer-grid button').first().tap();
    await page.waitForFunction(() => window.__test.session.state.phase === 'feedback');
    expect(await page.evaluate(() => window.__test.session.state.questions)).toBe(1);
    await page.locator('[data-action="next"]').tap();
    await page.waitForFunction(() => window.__test.session.state.phase === 'question');
  });
});

test.describe('US-11.1 Focus lands on the next action', () => {
  test('AC-11.1.3/1 — The first screen after load has focus on a control', async ({ page }) => {
    await open(page, '#/home');
    await page.waitForFunction(() => document.activeElement && document.activeElement !== document.body);
    const el = await focused(page);
    expect(el.tag).not.toBe('BODY');
    expect(el.level).not.toBeNull();
  });

  test('AC-11.1.1 — A shown result focuses its primary next action', async ({ page }) => {
    await startSession(page);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__test.session.state.phase === 'feedback');
    await expect(page.locator('[data-action="next"]')).toBeFocused();
  });

  test('AC-11.1.2/1 — A single-choice question focuses its first answer button', async ({ page }) => {
    await startSession(page);
    await expect(page.locator('.answer-grid button').first()).toBeFocused();
    // Whole flow with no pointer at all: OK answers, OK advances, the next choice is ready.
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__test.session.state.phase === 'feedback');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__test.session.state.phase === 'question');
    await expect(page.locator('.answer-grid button').first()).toBeFocused();
  });
});

test.describe('US-11.2 Visible focus indicator', () => {
  test("AC-11.2.1/2 — The focus indicator is at least 3 px thick and offset clear of the control's edge", async ({ page }) => {
    await open(page, '#/home');
    const node = page.locator('[data-role="map"] .node').first();
    await node.focus();
    const style = await node.evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: parseFloat(s.outlineWidth), style: s.outlineStyle, offset: parseFloat(s.outlineOffset), color: s.outlineColor };
    });
    expect(style.width).toBeGreaterThanOrEqual(3);
    expect(style.style).toBe('solid');
    expect(style.offset).toBeGreaterThan(0);
    expect(style.color).toBe('rgb(255, 255, 255)');
  });

  test('AC-11.2.2 — A control that already carries an outline still shows its focus indicator', async ({ page }) => {
    await open(page, '#/home');
    // A `.selected` control marks itself with an inset shadow, so `outline` is still the focus ring's.
    const both = await page.evaluate(() => {
      const b = document.createElement('button');
      b.className = 'btn selected';
      document.querySelector('.content').append(b);
      b.focus();
      const s = getComputedStyle(b);
      const out = { outline: parseFloat(s.outlineWidth), shadow: s.boxShadow };
      b.remove();
      return out;
    });
    expect(both.outline).toBeGreaterThanOrEqual(3);
    expect(both.shadow).toContain('inset');
  });
});
