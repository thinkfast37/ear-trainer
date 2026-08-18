/**
 * Optional practice reminder (AC-9.2.3): schedules a daily local notification on the
 * Capacitor build; a no-op on the web. `plugin` is @capacitor/local-notifications (or a fake).
 */
export const REMINDER_ID = 4242;

export function createNotifications({ plugin = null, isNative = false } = {}) {
  const available = Boolean(plugin) && isNative;
  return {
    available,
    async sync(settings) {
      if (!available) return { scheduled: false };
      if (!settings.enabled) { await plugin.cancel({ notifications: [{ id: REMINDER_ID }] }); return { scheduled: false }; }
      const perm = await plugin.requestPermissions();
      if (perm.display !== 'granted') return { scheduled: false, reason: 'denied' };
      await plugin.schedule({ notifications: [{
        id: REMINDER_ID, title: 'Ear Trainer', body: 'Time for a short practice session.',
        schedule: { on: { hour: settings.hour ?? 19, minute: 0 }, allowWhileIdle: true },
      }] });
      return { scheduled: true, hour: settings.hour ?? 19 };
    },
  };
}
