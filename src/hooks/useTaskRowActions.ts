import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { deleteTask, restoreTask, setTaskCompleted } from '@/db/mutations';
import type { RowAnchor, TaskWithCategory } from '@/lib/types';

const UNDO_WINDOW_MS = 5000;

interface MenuState {
  task: TaskWithCategory;
  anchor: RowAnchor;
}

// Centralizes the row gesture / edit / delete-with-undo / long-press-menu
// flow so every screen that renders a SwipeableTaskRow (Tasks tab, Day,
// Week) shares one TaskContextMenu + UndoToast pair instead of re-deriving
// this state per screen.
export function useTaskRowActions() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [pendingUndo, setPendingUndo] = useState<TaskWithCategory | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Lets TaskContextMenu's Delete button replay the same slide-out +
  // collapse animation as a direct swipe, keyed by task id so it always
  // targets the row that was actually long-pressed.
  const rowExitTriggers = useRef(new Map<string, (direction: 1 | -1) => void>());

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  async function toggleComplete(task: TaskWithCategory) {
    await setTaskCompleted(task.id, !task.completed);
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

  const deleteWithUndo = useCallback(async (task: TaskWithCategory) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    await deleteTask(task.id);
    setPendingUndo(task);
    undoTimer.current = setTimeout(() => setPendingUndo(null), UNDO_WINDOW_MS);
  }, []);

  const registerRowExit = useCallback((taskId: string, trigger: (direction: 1 | -1) => void) => {
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
      trigger(1);
    } else {
      deleteWithUndo(target);
    }
  }, [menu, deleteWithUndo]);

  const undoDelete = useCallback(async () => {
    if (!pendingUndo) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const { category: _category, ...row } = pendingUndo;
    setPendingUndo(null);
    await restoreTask(row);
  }, [pendingUndo]);

  function dismissUndo() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setPendingUndo(null);
  }

  function openNewTask(prefillDate?: string) {
    router.push({ pathname: '/task-form', params: prefillDate ? { dueDate: prefillDate } : {} });
  }

  return {
    menu,
    toggleComplete,
    openMenu,
    closeMenu,
    editTask,
    deleteWithUndo,
    registerRowExit,
    confirmMenuDelete,
    pendingUndo,
    undoDelete,
    dismissUndo,
    openNewTask,
  };
}
