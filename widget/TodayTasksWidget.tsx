'use no memo';

import { FlexWidget, ListWidget, SvgWidget, TextWidget } from 'react-native-android-widget';

import { formatTime12h } from '@/lib/dates';
import type { TaskStatus } from '@/lib/status';
import type { TaskWithCategory } from '@/lib/types';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

// Rendered inside react-native-android-widget's headless task
// (widget/widget-task-handler.tsx) — no hooks, no async children, only the
// library's primitives (FlexWidget/ListWidget/TextWidget/SvgWidget), per its
// "widgets must not use hooks" rule.
export function TodayTasksWidget({ tasks }: { tasks: TaskWithCategory[] }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.bgSurface,
        borderRadius: 20,
        paddingVertical: 8,
      }}
    >
      {tasks.length === 0 ? (
        <FlexWidget
          clickAction="OPEN_APP"
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <TextWidget
            text="No tasks today"
            style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary }}
          />
        </FlexWidget>
      ) : (
        <ListWidget>
          {tasks.map((task) => (
            <TaskRowWidget key={task.id} task={task} />
          ))}
        </ListWidget>
      )}
    </FlexWidget>
  );
}

function TaskRowWidget({ task }: { task: TaskWithCategory }) {
  const isDone = task.status === 'done';
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `tabtasks://task-form?id=${task.id}` }}
      accessibilityLabel={`${task.title}, ${STATUS_SPOKEN[task.status]}${task.dueTime ? `, due ${formatTime12h(task.dueTime)}` : ''}. Opens the task.`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: 'match_parent',
        height: 44,
        // The status target below is 44dp wide with the square centered,
        // which puts the square 12dp from the edge on its own.
        paddingRight: 12,
      }}
    >
      <StatusIndicator status={task.status} taskId={task.id} />
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={task.title}
          maxLines={1}
          truncate="END"
          style={{
            fontFamily: fonts.bodyMedium,
            fontSize: 14,
            color: isDone ? colors.textMuted : colors.textPrimary,
          }}
        />
      </FlexWidget>
      {task.dueTime ? (
        <TextWidget
          text={formatTime12h(task.dueTime)}
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            color: isDone ? colors.textMuted : colors.textSecondary,
            marginLeft: 8,
          }}
        />
      ) : null}
    </FlexWidget>
  );
}

const STATUS_SPOKEN: Record<TaskStatus, string> = { todo: 'to do', active: 'active', done: 'done' };

// A 20dp rounded square: empty outline (todo), lime outline + inner dot
// (active), filled lime + check (done) — the same three states as
// src/components/TaskRow.tsx's checkbox, tap-clickable on its own to cycle
// status without opening the app (the row body around it opens the app
// instead — see TaskRowWidget's own clickAction).
//
// RemoteViews has no hitSlop, so the clickable is a full row-height 44×44dp
// box with the square centered in it — a bare 20dp clickable meant a near
// miss landed on the row and opened the app instead of changing status.
function StatusIndicator({ status, taskId }: { status: TaskStatus; taskId: string }) {
  return (
    <FlexWidget
      clickAction="CYCLE_STATUS"
      clickActionData={{ taskId, status }}
      accessibilityLabel={`Status, ${STATUS_SPOKEN[status]}. Tap to change.`}
      style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
    >
      <StatusSquare status={status} />
    </FlexWidget>
  );
}

function StatusSquare({ status }: { status: TaskStatus }) {
  if (status === 'done') {
    return (
      <FlexWidget
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          backgroundColor: colors.accentPrimary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <SvgWidget
          svg={`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${colors.bgBase}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`}
          style={{ width: 12, height: 12 }}
        />
      </FlexWidget>
    );
  }

  const isActive = status === 'active';
  return (
    <FlexWidget
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: isActive ? colors.accentPrimary : colors.borderStrong,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {isActive ? (
        <FlexWidget
          style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: colors.accentPrimary }}
        />
      ) : null}
    </FlexWidget>
  );
}
