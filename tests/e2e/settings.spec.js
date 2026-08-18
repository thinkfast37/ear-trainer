import { test, expect } from '@playwright/test';
import { open } from './helpers.js';

const setting = (page, name) => page.locator(`[data-setting="${name}"]`);
const settingsOf = (page) => page.evaluate(() => window.__test.settings());

test.describe('US-10.4 Settings', () => {
  test('AC-10.4.1/1 — Cadence frequency is configurable', async ({ page }) => {
    await open(page, '#/settings');
    await setting(page, 'cadenceFrequency').selectOption('never');
    expect((await settingsOf(page)).cadenceFrequency).toBe('never');
    await setting(page, 'cadenceFrequency').selectOption('firstOnly');
    expect((await settingsOf(page)).cadenceFrequency).toBe('firstOnly');
  });
  test('AC-10.4.1/2 — Replay limits are configurable', async ({ page }) => {
    await open(page, '#/settings');
    await setting(page, 'replayLimit').fill('5'); await setting(page, 'replayLimit').dispatchEvent('change');
    expect((await settingsOf(page)).replayLimit).toBe(5);
  });
  test('AC-10.4.1/3 — Arpeggiation tempo is configurable', async ({ page }) => {
    await open(page, '#/settings');
    await setting(page, 'arpeggioTempo').fill('90'); await setting(page, 'arpeggioTempo').dispatchEvent('change');
    expect((await settingsOf(page)).arpeggioTempo).toBe(90);
  });
  test('AC-10.4.1/4 — Register range is configurable', async ({ page }) => {
    await open(page, '#/settings');
    await setting(page, 'register.low').fill('52'); await setting(page, 'register.low').dispatchEvent('change');
    await setting(page, 'register.high').fill('76'); await setting(page, 'register.high').dispatchEvent('change');
    expect((await settingsOf(page)).register).toEqual({ low: 52, high: 76 });
  });
  test('AC-10.4.1/5 — Label display is configurable for solfège or numbers and symbol or name', async ({ page }) => {
    await open(page, '#/settings');
    await setting(page, 'labels.degrees').selectOption('number');
    await setting(page, 'labels.chords').selectOption('name');
    await setting(page, 'labels.intervals').selectOption('full');
    expect((await settingsOf(page)).labels).toEqual({ degrees: 'number', chords: 'name', intervals: 'full' });
    await setting(page, 'labels.degrees').selectOption('syllable');
    await setting(page, 'labels.chords').selectOption('symbol');
    expect((await settingsOf(page)).labels).toMatchObject({ degrees: 'syllable', chords: 'symbol' });
  });
  test('AC-10.4.1/6 — Session goal is configurable', async ({ page }) => {
    await open(page, '#/settings');
    await setting(page, 'sessionGoal.minutes').fill('15'); await setting(page, 'sessionGoal.minutes').dispatchEvent('change');
    await setting(page, 'sessionGoal.questions').fill('40'); await setting(page, 'sessionGoal.questions').dispatchEvent('change');
    expect((await settingsOf(page)).sessionGoal).toEqual({ minutes: 15, questions: 40 });
  });
  test('AC-10.4.1/7 — The notification toggle is configurable on mobile', async ({ page }) => {
    await open(page, '#/settings');
    const box = page.locator('[data-role="notifications"]');
    await expect(box).toBeVisible();
    const toggle = setting(page, 'notifications.enabled');
    await expect(toggle).toHaveCount(1);
    // on the web build the control is present but disabled (mobile-only capability); the hour is still configurable
    await expect(toggle).toBeDisabled();
    await expect(box).toContainText('mobile app only');
    await setting(page, 'notifications.hour').fill('8'); await setting(page, 'notifications.hour').dispatchEvent('change');
    expect((await settingsOf(page)).notifications.hour).toBe(8);
    // (the native path — toggle enabled and driving the plugin — is proved in tests/unit/ui/notifications.test.js)
    expect(await page.evaluate(() => window.__test.platform.isNative)).toBe(false);
  });
  test('AC-10.4.2 — Settings persist across a restart', async ({ page }) => {
    await open(page, '#/settings');
    await setting(page, 'cadenceFrequency').selectOption('never');
    await setting(page, 'replayLimit').fill('6'); await setting(page, 'replayLimit').dispatchEvent('change');
    await setting(page, 'labels.degrees').selectOption('number');
    await page.waitForTimeout(150); // debounced persist
    await page.reload();
    await page.waitForFunction(() => window.__test && window.__test.ready === true);
    const s = await settingsOf(page);
    expect(s.cadenceFrequency).toBe('never'); expect(s.replayLimit).toBe(6); expect(s.labels.degrees).toBe('number');
    await expect(setting(page, 'cadenceFrequency')).toHaveValue('never');
    await expect(setting(page, 'replayLimit')).toHaveValue('6');
  });
  test('AC-10.4.3 — A Credits view reachable from Settings lists every bundled asset and its licence', async ({ page }) => {
    await open(page, '#/settings');
    await page.locator('[data-action="credits"]').tap();
    await expect(page.locator('[data-role="credits"]')).toBeVisible();
    const items = page.locator('[data-role="credits"] li[data-asset]');
    await expect(items).toHaveCount(2);
    const samples = items.filter({ hasText: 'Piano samples' });
    await expect(samples).toContainText('Salamander');
    await expect(samples.locator('[data-role="licence"]')).toContainText('CC BY 3.0');
    await expect(samples).toContainText('github.com/nbrosowsky/tonejs-instruments');
  });
});
