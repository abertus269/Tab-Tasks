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
