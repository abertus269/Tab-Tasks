# SPEC.md — To-Do App Functional Specification

## 1. Overview

A simple, local-first to-do app for personal task management. Tasks belong to
user-defined categories (Personal, Studies, Work, etc.) but are shown together
in one unified, chronologically-sorted list. A second tab offers a calendar
view of the same data at four zoom levels: Day, Week, Month, and Year.
No account, no cloud sync — everything lives on-device.

## 2. Core Concepts

### 2.1 Task

| Field         | Type             | Notes                                  |
| ------------- | ---------------- | -------------------------------------- |
| `id`          | string (uuid)    |                                        |
| `title`       | string           | required                               |
| `dueDate`     | date             | required — drives all sorting/grouping |
| `dueTime`     | time             | optional                               |
| `description` | string           | optional, free text                    |
| `categoryId`  | string \| null   | references a Category                  |
| `icon`        | Lucide icon name | optional, user-selected                |
| `status`      | `'todo' \| 'active' \| 'done'` | default `'todo'` — cycled by tapping the row |
| `createdAt`   | datetime         | for tie-breaking / audit               |

### 2.2 Category

User-created, user-editable groupings (e.g. "Personal", "Studies", "Work").

| Field   | Type             | Notes                                  |
| ------- | ---------------- | -------------------------------------- |
| `id`    | string (uuid)    |                                        |
| `name`  | string           | required, unique                       |
| `color` | string (hex)     | used for chips/badges                  |
| `icon`  | Lucide icon name | optional, shown on the category's chip |

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
  later. If nothing is overdue, the line sits at the very top. A second,
  quieter **Upcoming** divider sits right after the last task dated today,
  so a future task can never read as due today just because it's the next
  row (§10/§11 "Add tasks Not for Today" / "Today bar"). When nothing is due
  today but a future task exists, a muted "Nothing due today" row sits
  between the two dividers instead of letting them stack directly on top of
  each other.
- **Add:** a persistent "add task" affordance opens the create form (§6).
- **Remove:** swipe-to-complete or long-press → Delete in the row's context
  menu (the per-row overflow button this section used to describe was
  replaced — see §10/§11 "Swipe to Complete").
- **Status/complete:** tapping anywhere on a row cycles its status —
  `todo → active → done → todo` — via a togglable "cycle" setting (default
  on); with it off, a tap is a plain done/not-done toggle. Swiping a row
  either direction is a direct done/undone toggle, independent of that
  setting. Editing lives behind long-press → Edit in the row's context menu.
- **Completing a task removes it from this list** (superseding the original
  "completed tasks stay visible, dimmed" behavior — see §9 and §10 "Swipe
  completes and clears the row"): a completing swipe or tap plays a
  slide-out + collapse exit animation, then writes `status: 'done'` and
  shows a 5s "Task completed · Undo" toast that restores the previous
  status. A trailing **Completed** filter chip (below) shows only done
  tasks, struck through, with no Today/Upcoming dividers; tapping or
  swiping a row there reopens it the same way, with a "Task reopened ·
  Undo" toast.
- Each row shows: checkbox-style status indicator · title · category chip ·
  due date/time · optional task icon.
- **Filter chips** above the list: All · one per category · Uncategorized ·
  a trailing **Completed** chip. These narrow the _view_ only — they never
  change the underlying merged sort order. Completed is a mode, mutually
  exclusive with the others (there's no separate "show completed" toggle
  layered on top of category filtering).

## 5. Calendar Tab

One dataset, four ways to look at it, switched via a segmented control. The
currently-viewed date persists across mode switches where it makes sense
(e.g. Day→Week keeps you in the same week).

Unlike the Tasks tab (§4), Day and Week's agendas keep showing done tasks in
place — dimmed and struck through — since an agenda is a record of the day,
not a working list. Swiping a row here just flips its status and springs
back; it never leaves the list and there's no undo toast.

### 5.1 Day

Vertical agenda for a single day — same row style as the Tasks tab. A
date strip/picker moves a day at a time.

### 5.2 Week

A scrollable list of weeks, each showing its date range (e.g. "Aug 24 – 30")
and total task count — structurally identical to §5.4 Year's list of years,
one level down. Tapping a week is the entry point into that week's 7-day
agenda: the same day-by-day stacked layout Day view uses, one labeled
section per day, bounded to just that week.

### 5.3 Month

A traditional calendar grid (weeks as rows, days as columns). Each date cell
shows a task-count indicator. Tapping a date jumps into Day view for it.

### 5.4 Year

A list of years that have tasks (plus the current year), each showing the
total task count for that year. Tapping a year is the entry point into that
year's Month view.

## 6. Task Create/Edit Form

Fields: Title (required) · Due date (required) · Due time (optional) ·
Description (optional) · Category (select or create) · Icon (Lucide picker —
a curated ~100-icon set grouped into themed sections with headers, one
searchable scrolling grid, matched by name or keyword).
Actions: Save / Cancel / (Delete, when editing).

## 7. Persistence

Everything is stored **locally on-device only** — no backend, no account, no
network dependency. Data must survive app restarts and updates.

## 8. Suggested Technical Approach

_A recommendation, not a hard requirement._

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

- **Icon scope:** assumes each _task_ gets its own optional icon, separate
  from each _category's_ icon (the literal reading of the brief). If you
  actually meant category-level icons only, that's a smaller, cleaner model
  — worth deciding before the icon picker gets built.
- **Completed tasks:** originally assumed they'd stay visible
  (dimmed/struck-through) rather than disappearing from the list, matching
  the reference screenshot. **Superseded on the user's explicit request** —
  see §4/§10 "Swipe completes and clears the row": the Tasks tab now hides
  done tasks behind a Completed filter chip. Calendar's Day/Week agendas
  still follow the original assumption and show done tasks in place (§5).
- **Reminders/notifications:** not mentioned in the original brief; shipped
  post-v1 via `expo-notifications` — see CLAUDE.md's Reminders section.
- **Recurring tasks:** not mentioned — out of scope for v1, flagging only
  because "Daily tasks" as a category name (from your references) sometimes
  implies recurrence.
- **Multiple categories per task:** assumes one category per task — the
  simplest reading of "separation between personal, studies, etc." Multi-tag
  support would be a bigger model change.

## 10. Extra Features

Will be prompted to do these and when asked to do so this will be used as reference
Also make sure to use this indicator of completion
[] -> haven't started
[/] -> currently working on
[X] -> completed
[-] -> needs revisiting

- **Tapping On Tasks:** [X] When tapping on a task it currently only completes it, ontop of swiping the task away,
  lets say for one tap, it changes it to it being marked as being worked on, another tap ends the task,
  another tap restarts it back to uncomplete. I wan't this to be a toggleable setting if users would rather click then task done
  — done: tapping now cycles todo → active → done → todo, and the cycle can be switched off in
  Settings (a plain tap then just marks done/not-done). Editing moved to long-press → Edit, since a
  plain tap is now taken by the status cycle.

- **Theming:** Maybe in the settings (LATER) changing the theme of the app can be possible.
  Through the colours that have been already selected and are being used for category colours.

- **Settings:** [X] A minimal Settings screen (`src/app/settings.tsx`), reached from a gear icon in
  the Tasks tab header. Currently holds the tap-cycles-status toggle above, stored in a `settings`
  key/value table so it survives app restarts. A home for Theming later.

- **Swipe to Complete:** [X] Dragging a task row either direction past ~40% of its width (or a fast
  flick) marks it done — or undoes it back to todo if it was already done — with a green backdrop
  and a checkmark icon (previously swipe deleted, in red with a bin icon; see §10/§11 "Swiping should
  be completed not deleted"). A partial drag springs back to rest. The ⋮ overflow button is gone —
  long-pressing a row opens an Edit/Delete menu anchored on the row itself, and Delete now lives only
  there. (On the Tasks tab the row now leaves the list on completion instead of staying struck
  through in place — see "Swipe completes and clears the row" below.)

- **Swipe completes and clears the row:** [X] On the Tasks tab, a completing swipe (or a tap that
  crosses into `done` via the status cycle) now plays the same slide-out + collapse exit animation
  a delete does, then writes the status and shows a "Task completed · Undo" toast (5s, restores the
  previous status). A trailing **Completed** filter chip shows only done tasks, struck through, with
  no Today/Upcoming dividers; reopening one there (tap or swipe) exits that view too, with a "Task
  reopened · Undo" toast. Empty-state copy: "No completed tasks yet." for the Completed chip itself,
  "All done." when every task in the current scope is done, otherwise the existing "No tasks yet." /
  "No tasks in this category." Calendar's Day/Week agendas are unchanged by this — they keep showing
  done tasks in place (§5).

- **More icons:** [X] Grew the curated Lucide set from 45 to ~100 icons, grouped into themed
  sections (General, Work & Study, Home, Health, Food & Drink, Travel, Fun & Hobbies, People &
  Messages, Nature & Animals, Money, Tech). The icon picker (§6) now shows a section header per
  group above its rows, still one searchable scrolling grid, matched by name or a small keyword
  synonym list (e.g. "gym" finds the dumbbell icon). Kept cheap to scroll via fixed row/header
  heights (`getItemLayout`) and memoized cells rather than by limiting the count.

- **WIDGET:** [] Would be nice to see daily tasks if need to be done.
  And swiping on it completes the task and tapping on it goes into the app.
  Or does the toggle to doing/ complete, original state.
  Either as a 2 x 2 or a 2 x 4 widget shape.

- **Exporting Tasks & Categories:** [] Should do automatically.
  Save tasks and categories should save locally so when
  Updates come around, tasks will auto import so updates
  don't muck with it.

## 11. Bugs/ Fixes

When these will be prompted, it is minor (maybe major) fixes that I would like to occur.
Make sure to thoroughly make sure that the task is done to completion and doesn't result in more side effects.
Also make sure to use this indicator of completion
[] -> haven't started
[/] -> currently working on
[X] -> completed
[-] -> needs revisiting

- **Add tasks Too Big:** [X] The Add task button was a full-bleed lime slab (~44px tall, inset 32px
  vs. the rows' 16px — it didn't even line up with the list). It's now a small, self-sized, centered
  pill.

- **Add tasks Not for Today:** [X] I add tasks for days in the future, but the line indicating today shows that tasks in the future are for today?
  Surely if all tasks are done for today, make sure to clearly seperate it from future tasks.
  Fixed by adding a second "Upcoming" divider after today's tasks (or a "Nothing due today" row
  when there aren't any), so a future task never sits directly under "Today" — see §4.

- **Month -> going through days:** [X] Navigating the Calendar tab's Day view with the ◀ ▶ arrows
  changed the header's date label but kept showing the *first* day's tasks — the underlying
  `useLiveQuery` hook (from drizzle's `expo-sqlite` integration) needs its re-subscribe dependencies
  passed explicitly or it subscribes once on mount and never re-runs the query when the date range
  changes. Fixed in `src/hooks/useTasks.ts`; applies to Day view, Week view, and Month view's
  task-count dots alike, since they all go through the same hook.

- **Double bins:** [X] When I delete a task through hold and delete.
  I see that there are two bins, make sure for swiping, only one bin appears, and when using the holding and deleting option.
  Make sure either there are no bins, or maybe a bin in the middle.
  Fixed: only the icon under the edge you actually dragged (or the long-press Delete animation
  slides toward) shows, for both paths — they share the same underlying animation.

- **Swiping should be completed not deleted:** [X]
  When I complete a task via swiping, make it green instead of red for deleting, maybe a check mark icon when swiping it away.
  Done: swiping either direction now marks a task done (or undoes an already-done task back to
  todo) with a lime-green backdrop and a checkmark icon, instead of deleting. Delete moved entirely
  to long-press → Delete in the row's context menu. (On the Tasks tab, completing a task now also
  removes its row from the list — see §10 "Swipe completes and clears the row".)

- **Today bar:** [X]
  I think the today bar appears that every task even for today and in the future appears to show that every task is for today which is not the case.
  I was thinking of add a line for Today, Tomorrow, and Later.
  With all previous tasks above the today being previous.
  Done via a Today + Upcoming two-band split (§4) — overdue tasks stay unlabelled above Today, as
  you described. Flag it back open if you still want a distinct third "Tomorrow" band separate from
  "Later" — that's a small follow-up on top of this, not built yet.
