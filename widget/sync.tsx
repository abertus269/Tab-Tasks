import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { getTodayTasksForWidget } from '@/lib/widgetData';

import { TodayTasksWidget } from './TodayTasksWidget';

// Exported so src/app/settings.tsx's requestPinWidget call references the
// same name instead of duplicating the string.
export const WIDGET_NAME = 'TodayTasks';

// Called from src/db/mutations.ts after any change that could affect "today's
// tasks" — the widget only re-queries on its own widget events (add/resize/
// click), so an in-app edit has no other way to reach it. No-ops off Android
// (this app has no iOS target — see CLAUDE.md) and silently if no instance of
// the widget is on the home screen (requestWidgetUpdate's widgetNotFound).
// Every mutation in src/db/mutations.ts awaits this, so a thrown error here
// must never surface as a failed task save — swallow and log instead.
export async function syncWidget(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: async () => <TodayTasksWidget tasks={await getTodayTasksForWidget()} />,
    });
  } catch (error) {
    console.warn('[widget] syncWidget failed', error);
  }
}
