import * as Notifications from 'expo-notifications';

import { reminderFireDate } from './reminders';
import type { TaskRecord } from './types';

const REMINDER_CHANNEL_ID = 'reminders';

// Must run before any scheduling call, and before requesting permission — the
// channel is what the Android permission prompt attaches to.
export async function initNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Task reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted;
}

// Requests permission only if not already decided — call this at the moment
// the user first turns a reminder on, never at app launch (see CLAUDE.md).
export async function ensureNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Cancels any existing reminder for this task, then reschedules if it still
// has a future fire time. Keyed on the task's own id, so cancel/reschedule
// never needs to track a separate notification id.
export async function syncTaskReminder(task: TaskRecord): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(task.id);

  if (task.completed) return;

  const fireDate = reminderFireDate(task.dueDate, task.dueTime, task.reminderMinutesBefore);
  if (!fireDate || fireDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: task.id,
    content: { title: task.title, body: task.description ?? undefined },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(taskId);
}
