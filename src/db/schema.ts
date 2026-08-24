import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  icon: text('icon'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    // Calendar date 'YYYY-MM-DD' and clock time 'HH:mm' — stored as plain text,
    // never as an epoch timestamp. A due date is a calendar date, not an instant:
    // storing it as a timestamp would let a timezone/DST shift silently move a
    // task across a day boundary and corrupt the today-divider and every
    // calendar bucket. Text sorts lexicographically = chronologically.
    dueDate: text('due_date').notNull(),
    dueTime: text('due_time'),
    description: text('description'),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    icon: text('icon'),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    // null = no reminder; 0 = at due time; otherwise minutes before dueDate/dueTime.
    reminderMinutesBefore: integer('reminder_minutes_before'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    index('tasks_due_idx').on(table.dueDate, table.dueTime),
    index('tasks_category_idx').on(table.categoryId),
  ],
);
