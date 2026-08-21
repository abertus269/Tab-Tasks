# SPEC.md — To-Do App Functional Specification

## 1. Overview

A simple, local-first to-do app for personal task management. Tasks belong to
user-defined categories (Personal, Studies, Work, etc.) but are shown together
in one unified, chronologically-sorted list. A second tab offers a calendar
view of the same data at four zoom levels: Day, Week, Month, and Year.
No account, no cloud sync — everything lives on-device.

## 2. Core Concepts

### 2.1 Task

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | |
| `title` | string | required |
| `dueDate` | date | required — drives all sorting/grouping |
| `dueTime` | time | optional |
| `description` | string | optional, free text |
| `categoryId` | string \| null | references a Category |
| `icon` | Lucide icon name | optional, user-selected |
| `completed` | boolean | default `false` |
| `createdAt` | datetime | for tie-breaking / audit |

### 2.2 Category

User-created, user-editable groupings (e.g. "Personal", "Studies", "Work").

| Field | Type | Notes |
|---|---|---|
| `id` | string (uuid) | |
| `name` | string | required, unique |
| `color` | string (hex) | used for chips/badges |
| `icon` | Lucide icon name | optional, shown on the category's chip |

- Full CRUD: create, rename, recolor, re-icon, delete.
- Deleting a category should prompt: reassign its tasks to "Uncategorized" or
  delete them too. Default to reassigning — never silently delete tasks.

## 3. Navigation

Two primary tabs:

1. **Tasks** — default/home tab. Flat, unified list.
2. **Calendar** — the same task data, browsable by Day / Week / Month / Year.

A single "Add Task" entry point should be reachable from both tabs.

## 4. Tasks Tab

- Shows every task from every category in **one continuous list** — not split
  into per-category sections.
- **Sort order:** ascending by `dueDate` then `dueTime` — the task due soonest
  sits at the top, regardless of category.
- **Today divider:** a horizontal line/marker inserted into the list at the
  current date. Everything above is overdue; everything below is today or
  later. If nothing is overdue, the line sits at the very top.
- **Add:** a persistent "add task" affordance opens the create form (§6).
- **Remove:** swipe-to-delete or a per-row overflow menu.
- **Edit:** tapping a task opens it, pre-filled, in the same form.
- **Complete:** a checkbox toggles `completed`; completed tasks get a
  strikethrough and visually recede (dimmed), but stay in the list.
- Each row shows: checkbox · title · category chip · due date/time · optional
  task icon.
- Optional: category filter chips above the list to narrow the *view* only —
  this never changes the underlying merged sort order.

## 5. Calendar Tab

One dataset, four ways to look at it, switched via a segmented control. The
currently-viewed date persists across mode switches where it makes sense
(e.g. Day→Week keeps you in the same week).

### 5.1 Day
Vertical agenda for a single day — same row style as the Tasks tab. A
date strip/picker moves a day at a time.

### 5.2 Week
Same vertical scroll pattern as Day, spanning 7 days — each day is a labeled
section containing its tasks, stacked one after another down the page.

### 5.3 Month
A traditional calendar grid (weeks as rows, days as columns). Each date cell
shows a task-count indicator. Tapping a date jumps into Day view for it.

### 5.4 Year
A list of years that have tasks (plus the current year), each showing the
total task count for that year. Tapping a year is the entry point into that
year's Month view.

## 6. Task Create/Edit Form

Fields: Title (required) · Due date (required) · Due time (optional) ·
Description (optional) · Category (select or create) · Icon (Lucide picker).
Actions: Save / Cancel / (Delete, when editing).

## 7. Persistence

Everything is stored **locally on-device only** — no backend, no account, no
network dependency. Data must survive app restarts and updates.

## 8. Suggested Technical Approach

*A recommendation, not a hard requirement.*

- **Framework:** Expo / React Native + TypeScript
- **Local storage:** `expo-sqlite`, with a thin query layer (e.g. Drizzle ORM)
  — a relational store makes the Day/Week/Month/Year date-range queries and
  category joins straightforward, and scales better than hand-rolled
  AsyncStorage bucketing as task counts grow.
- **State/data layer:** Zustand or React Query over the SQLite layer, so
  every view stays in sync after an add/edit/delete.
- **Icons:** `lucide-react-native`
- **Date logic:** `date-fns` for week/month/year bucketing and the
  today-divider calculation.

## 9. Open Questions / Assumptions

Flagged for you to confirm or override before/while building:

- **Icon scope:** assumes each *task* gets its own optional icon, separate
  from each *category's* icon (the literal reading of the brief). If you
  actually meant category-level icons only, that's a smaller, cleaner model
  — worth deciding before the icon picker gets built.
- **Completed tasks:** assumes they stay visible (dimmed/struck-through)
  rather than disappearing from the list, matching the reference screenshot.
- **Reminders/notifications:** not mentioned in the brief — out of scope
  for v1.
- **Recurring tasks:** not mentioned — out of scope for v1, flagging only
  because "Daily tasks" as a category name (from your references) sometimes
  implies recurrence.
- **Multiple categories per task:** assumes one category per task — the
  simplest reading of "separation between personal, studies, etc." Multi-tag
  support would be a bigger model change.