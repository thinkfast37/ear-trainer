// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createNotifications, REMINDER_ID } from '../../../src/platform/notifications.js';
import { renderSettings } from '../../../src/ui/settings.js';
import { createStore } from '../../../src/app/store.js';
import { emptyProgress } from '../../../src/storage/schema.js';
import { mount } from './dom.js';

function fakePlugin(permission = 'granted') {
  const calls = { scheduled: [], cancelled: [] };
  return { calls, async requestPermissions() { return { display: permission }; }, async schedule({ notifications }) { calls.scheduled.push(...notifications); }, async cancel({ notifications }) { calls.cancelled.push(...notifications); } };
}

describe('US-9.2 — reminder', () => {
  it('AC-9.2.3 — An optional local reminder fires on the mobile build', async () => {
    const plugin = fakePlugin();
    const notifications = createNotifications({ plugin, isNative: true });
    const store = createStore(emptyProgress());
    const root = mount(() => {});
    renderSettings(root, { store, go: () => {}, notifications, isNative: true });
    const toggle = root.querySelector('[data-setting="notifications.enabled"]');
    expect(toggle.disabled).toBe(false);
    toggle.checked = true; toggle.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(store.getState().settings.notifications.enabled).toBe(true);
    // a daily local notification is scheduled at the practice hour — it fires when the window passes without a session
    expect(plugin.calls.scheduled.length).toBe(1);
    const n = plugin.calls.scheduled[0];
    expect(n.id).toBe(REMINDER_ID); expect(n.schedule.on.hour).toBe(19); expect(n.body).toMatch(/practice/i);
    // turning it off cancels
    toggle.checked = false; toggle.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(plugin.calls.cancelled.map((c) => c.id)).toEqual([REMINDER_ID]);
    // on the web the toggle is disabled and the adapter is a no-op
    const web = createNotifications({ plugin: null, isNative: false });
    expect((await web.sync({ enabled: true })).scheduled).toBe(false);
    const root2 = mount(() => {}); renderSettings(root2, { store, go: () => {}, notifications: web, isNative: false });
    expect(root2.querySelector('[data-setting="notifications.enabled"]').disabled).toBe(true);
    // permission denied → not scheduled, no throw
    const denied = createNotifications({ plugin: fakePlugin('denied'), isNative: true });
    expect(await denied.sync({ enabled: true, hour: 8 })).toEqual({ scheduled: false, reason: 'denied' });
  });
});
