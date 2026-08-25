export interface CategoryRecord {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

export interface TaskRecord {
  id: string;
  title: string;
  dueDate: string; // 'YYYY-MM-DD'
  dueTime: string | null; // 'HH:mm'
  description: string | null;
  categoryId: string | null;
  icon: string | null;
  completed: boolean;
  reminderMinutesBefore: number | null;
  createdAt: string;
}

export interface TaskWithCategory extends TaskRecord {
  category: CategoryRecord | null;
}

// Screen-space rect of a rendered TaskRow, captured via measureInWindow at
// long-press time so TaskContextMenu can float its Edit/Delete card directly
// against that row instead of a bottom sheet.
export interface RowAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}
