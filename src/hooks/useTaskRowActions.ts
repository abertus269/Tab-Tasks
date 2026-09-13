import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { deleteTask, restoreTask, setTaskStatus } from '@/db/mutations';
import { useSettings } from '@/hooks/useSettings';
import { crossesDone, nextStatus } from '@/lib/status';
import type { CompleteBehavior, RowAnchor, RowExitTrigger, TaskWithCategory } from '@/lib/types';
import { undoToastMessage, type PendingUndo } from '@/lib/undo';

const UNDO_WINDOW_MS = 5000;

interface MenuState {
  task: TaskWithCategory;
  anchor: RowAnchor;
}

// Centralizes the row gesture / edit / delete-with-undo / long-press-menu
// flow so every screen that renders a SwipeableTaskRow (Tasks tab, Day,
// Week) shares one TaskContextMenu + UndoToast pair instead of re-deriving
// this state per screen. `completeBehavior` must match the mode every row
// on this screen is rendered with (src/lib/types.ts) — the Tasks tab passes
// 'exit' (done tasks leave the list), Calendar passes 'toggle' (done tasks
// stay, struck through).
export function useTaskRowActions({ completeBehavior }: { completeBehavior: CompleteBehavior }) {
  const router = useRouter();
  const { tapCyclesStatus } = useSettings();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Lets TaskContextMenu's Delete button, and (in 'exit' mode) a tap that
  // crosses the done boundary, replay the same slide-out + collapse
  // animation as a direct swipe, keyed by task id so it always targets the
  // row that was actually acted on.
  const rowExitTriggers = useRef(new Map<string, RowExitTrigger>());

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const startUndoWindow = useCallback((pending: PendingUndo) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setPendingUndo(pending);
    undoTimer.current = setTimeout(() => setPendingUndo(null), UNDO_WINDOW_MS);
  }, []);

  // Swipe is a direct done/not-done toggle, always — unlike a tap, it never
  // respects the cycle setting. A big deliberate gesture maps to a big
  // deliberate outcome: mark done, or undo a done task back to todo. In
  // 'exit' mode (Tasks tab) this only ever runs after the row has already
  // slid out and collapsed (SwipeableTaskRow calls it from finishExit), so
  // it's also what a tap-to-done hands off to below; in 'toggle' mode
  // (Calendar) it runs immediately on release and the row stays put, with
  // no undo toast — swiping it again undoes it.
  const completeTask = useCallback(
    async (task: TaskWithCategory) => {
      const previousStatus = task.status;
      await setTaskStatus(task.id, nextStatus(task.status, false));
      if (completeBehavior === 'exit') {
        startUndoWindow({ kind: 'status', task, previousStatus });
      }
    },
    [completeBehavior, startUndoWindow],
  );

  // In 'exit' mode, any status change that would make the row leave the
  // current view (Tasks tab's not-done list, or the Completed filter)
  // animates it out first — same exit as a swipe — instead of just
  // vanishing on the next render. A change that stays within the view
  // (todo -> active with the cycle setting on) writes in place, unanimated.
  async function cycleStatus(task: TaskWithCategory) {
    const next = nextStatus(task.status, tapCyclesStatus);
    if (completeBehavior === 'exit' && crossesDone(task.status, next)) {
      const trigger = rowExitTriggers.current.get(task.id);
      if (trigger) {
        trigger(1, 'complete');
      } else {
        await completeTask(task);
      }
      return;
    }
    await setTaskStatus(task.id, next);
  }

  function openMenu(task: TaskWithCategory, anchor: RowAnchor) {
    setMenu({ task, anchor });
  }

  function closeMenu() {
    setMenu(null);
  }

  function editTask(task: TaskWithCategory) {
    closeMenu();
    router.push({ pathname: '/task-form', params: { id: task.id } });
  }

  const deleteWithUndo = useCallback(
    async (task: TaskWithCategory) => {
      await deleteTask(task.id);
      startUndoWindow({ kind: 'delete', task });
    },
    [startUndoWindow],
  );

  const registerRowExit = useCallback((taskId: string, trigger: RowExitTrigger) => {
    rowExitTriggers.current.set(taskId, trigger);
    return () => {
      rowExitTriggers.current.delete(taskId);
    };
  }, []);

  const confirmMenuDelete = useCallback(() => {
    const target = menu?.task;
    closeMenu();
    if (!target) return;
    const trigger = rowExitTriggers.current.get(target.id);
    if (trigger) {
      trigger(1, 'delete');
    } else {
      deleteWithUndo(target);
    }
  }, [menu, deleteWithUndo]);

  const undo = useCallback(async () => {
    if (!pendingUndo) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setPendingUndo(null);
    if (pendingUndo.kind === 'delete') {
      const { category: _category, ...row } = pendingUndo.task;
      await restoreTask(row);
    } else {
      await setTaskStatus(pendingUndo.task.id, pendingUndo.previousStatus);
    }
  }, [pendingUndo]);

  function dismissUndo() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setPendingUndo(null);
  }

  function openNewTask(prefillDate?: string) {
    router.push({ pathname: '/task-form', params: prefillDate ? { dueDate: prefillDate } : {} });
  }

  return {
    completeBehavior,
    menu,
    cycleStatus,
    completeTask,
    openMenu,
    closeMenu,
    editTask,
    deleteWithUndo,
    registerRowExit,
    confirmMenuDelete,
    pendingUndo,
    undoMessage: undoToastMessage(pendingUndo),
    undo,
    dismissUndo,
    openNewTask,
  };
}
