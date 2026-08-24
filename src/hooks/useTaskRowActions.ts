import { useRouter } from 'expo-router';
import { useState } from 'react';

import { deleteTask, setTaskCompleted } from '@/db/mutations';
import type { TaskWithCategory } from '@/lib/types';

// Centralizes the row-menu / edit / delete / toggle flow so every screen that
// renders a TaskRow (Tasks tab, Day, Week) shares one RowActionsSheet
// instance instead of re-deriving this state per screen.
export function useTaskRowActions() {
  const router = useRouter();
  const [menuTask, setMenuTask] = useState<TaskWithCategory | null>(null);

  async function toggleComplete(task: TaskWithCategory) {
    await setTaskCompleted(task.id, !task.completed);
  }

  function openMenu(task: TaskWithCategory) {
    setMenuTask(task);
  }

  function closeMenu() {
    setMenuTask(null);
  }

  function editTask(task: TaskWithCategory) {
    closeMenu();
    router.push({ pathname: '/task-form', params: { id: task.id } });
  }

  async function confirmDelete() {
    if (menuTask) {
      await deleteTask(menuTask.id);
    }
    closeMenu();
  }

  function openNewTask(prefillDate?: string) {
    router.push({ pathname: '/task-form', params: prefillDate ? { dueDate: prefillDate } : {} });
  }

  return { menuTask, toggleComplete, openMenu, closeMenu, editTask, confirmDelete, openNewTask };
}
