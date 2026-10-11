import { FlexWidget, TextWidget, type WidgetTaskHandlerProps } from 'react-native-android-widget';

import { setTaskStatus } from '@/db/mutations';
import { nextStatus, type TaskStatus } from '@/lib/status';
import { getTapCyclesStatusSetting, getTodayTasksForWidget } from '@/lib/widgetData';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

import { TodayTasksWidget } from './TodayTasksWidget';

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'todo' || value === 'active' || value === 'done';
}

// Shown in place of the task list if the DB query/migration throws — e.g.
// the widget was placed before the app was ever opened. Tapping it opens the
// app rather than leaving a blank widget on the home screen.
function WidgetErrorFallback() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.bgSurface,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget
        text="Open Tab Tasks"
        style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary }}
      />
    </FlexWidget>
  );
}

// Runs as a headless JS task (react-native-android-widget, backed by
// WorkManager/ReactHost) whenever the widget is added, resized, updated, or
// tapped. Reuses the app's own setTaskStatus mutation (src/db/mutations.ts)
// rather than writing SQL directly, so reminder cancel/reschedule
// (src/lib/notifications.ts) stays in sync automatically — the same reason
// every other mutation in this app funnels through that module.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetAction, clickAction, clickActionData, renderWidget } = props;

  if (widgetAction === 'WIDGET_DELETED') return;

  try {
    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'CYCLE_STATUS') {
      const taskId = clickActionData?.taskId;
      const currentStatus = clickActionData?.status;
      if (typeof taskId === 'string' && isTaskStatus(currentStatus)) {
        const cycleEnabled = await getTapCyclesStatusSetting();
        await setTaskStatus(taskId, nextStatus(currentStatus, cycleEnabled));
      }
    }

    const tasks = await getTodayTasksForWidget();
    renderWidget(<TodayTasksWidget tasks={tasks} />);
  } catch (error) {
    console.warn('[widget] widgetTaskHandler failed, rendering fallback', error);
    renderWidget(<WidgetErrorFallback />);
  }
}
