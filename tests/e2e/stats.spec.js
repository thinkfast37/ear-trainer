import { test, expect } from '@playwright/test';
import { open, patchState } from './helpers.js';

function items() {
  return {
    'interval:P4:asc': { box: 2, attempts: 12, correct: 4, lastSeen: 5, confusions: { P5: 5, TT: 2, M3: 1 } },
    'interval:P5:asc': { box: 4, attempts: 10, correct: 8, lastSeen: 5, confusions: { P4: 2 } },
    'interval:P8:asc': { box: 5, attempts: 6, correct: 6, lastSeen: 5, confusions: {} },
    'interval:m3:asc': { box: 1, attempts: 3, correct: 0, lastSeen: 5, confusions: { M3: 3 } },
    'chord:maj:block': { box: 3, attempts: 8, correct: 5, lastSeen: 5, confusions: { min: 3 } },
  };
}

test.describe('US-9.4 Weakness dashboard', () => {
  test('AC-9.4.1 — Track detail shows accuracy, attempts and box for every item', async ({ page }) => {
    await open(page, '#/home');
    await patchState(page, { items: items() });
    await page.locator('[data-nav="stats"]').tap();
    await page.locator('[data-track-detail="intervals"]').tap();
    const rows = page.locator('[data-role="item-table"] tbody tr');
    await expect(rows).toHaveCount(4);
    const p4 = rows.filter({ hasText: 'interval:P4:asc' });
    await expect(p4.locator('[data-col="accuracy"]')).toHaveText('33%');
    await expect(p4.locator('[data-col="attempts"]')).toHaveText('12');
    await expect(p4.locator('[data-col="box"]')).toHaveText('2');
    await expect(rows.filter({ hasText: 'chord:maj' })).toHaveCount(0);
  });
  test('AC-9.4.2 — The weakest items are listed first', async ({ page }) => {
    await open(page, '#/home');
    await patchState(page, { items: items() });
    await page.locator('[data-nav="stats"]').tap();
    const list = page.locator('[data-role="weakest"] li');
    await expect(list).toHaveCount(4);
    const ids = await list.evaluateAll((els) => els.map((e) => e.dataset.item));
    // m3 has only 3 attempts (< 5) so is excluded; P4 (33%) is weakest, then chord:maj (63%), P5 (80%), P8 (100%)
    expect(ids).toEqual(['interval:P4:asc', 'chord:maj:block', 'interval:P5:asc', 'interval:P8:asc']);
  });
  test('AC-9.4.3 — Item detail shows the most frequent wrong answers', async ({ page }) => {
    await open(page, '#/home');
    await patchState(page, { items: items() });
    await open(page, '#/stats?track=intervals');
    await page.locator('[data-role="item-table"] tr[data-item="interval:P4:asc"]').tap();
    const conf = page.locator('[data-role="confusions"] li');
    await expect(conf).toHaveCount(3);
    await expect(conf.nth(0)).toHaveText('P5 × 5');
    await expect(conf.nth(1)).toHaveText('TT × 2');
    await expect(conf.nth(2)).toHaveText('M3 × 1');
  });
  test('AC-9.4.4 — A track shows an accuracy trend after seven days of history', async ({ page }) => {
    await open(page, '#/home');
    // seven days of dated answers in the intervals track
    const doc = await page.evaluate(() => {
      const d = JSON.parse(JSON.stringify(window.__test.store.getState()));
      const now = Date.now(); const history = []; d.days = {};
      for (let day = 0; day < 7; day++) { const at = now - day * 86400000; const k = new Date(at); const key = `${k.getFullYear()}-${String(k.getMonth() + 1).padStart(2, '0')}-${String(k.getDate()).padStart(2, '0')}`; d.days[key] = { questions: 5, seconds: 60, complete: false }; for (let i = 0; i < 5; i++) history.push({ item: 'interval:P5:asc', correct: i < 3 + (day % 2), at: at - i, replays: 0, score: 1 }); }
      d.levels['intervals:1'] = { mastered: false, masteredAt: null, subStage: 'asc', subStages: {}, history };
      return d;
    });
    await page.evaluate((d) => window.__test.store.replace(d), doc);
    await open(page, '#/stats?track=intervals');
    const trend = page.locator('[data-role="trend"]');
    await expect(trend).toBeVisible();
    await expect(trend.locator('.bar')).toHaveCount(7);
    // fewer than 7 days: no trend
    await page.evaluate(() => { const d = JSON.parse(JSON.stringify(window.__test.store.getState())); d.days = Object.fromEntries(Object.entries(d.days).slice(0, 3)); window.__test.store.replace(d); });
    // re-render in place (no reload) and confirm the trend is gone
    await page.evaluate(() => { window.location.hash = '#/stats'; });
    await expect(page.locator('[data-role="weakest"]')).toBeVisible();
    await page.evaluate(() => { window.location.hash = '#/stats?track=intervals'; });
    await expect(page.locator('[data-role="stats"] h2')).toHaveText('Intervals — items');
    await expect(page.locator('[data-role="trend"]')).toHaveCount(0);
  });
});
