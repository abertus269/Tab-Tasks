# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

Scaffolded. Expo (SDK 57) + React Native + TypeScript, `expo-router` for navigation, `expo-sqlite` +
Drizzle ORM for storage. `SPEC.md` and `DESIGN.md` remain the authoritative source for behavior and
visuals — this file summarizes the constraints that are easy to violate, not the full contents.

- `src/app/` — expo-router routes: `(tabs)/index.tsx` (Tasks), `(tabs)/calendar.tsx` (Calendar),
  `task-form.tsx` and `category-manager.tsx` (modals).
- `src/db/` — Drizzle schema, client, mutations, seed data. `src/drizzle/` holds generated migrations.
- `src/components/`, `src/theme/`, `src/lib/`, `src/hooks/`, `src/store/`.
- `android/` — prebuilt native project (gitignored; regenerate with `npx expo prebuild -p android`
  if missing). No `/ios` — this has only been targeted at Android so far.

## Commands

- `npm start` — Expo dev server.
- `npm run android` — build and run the debug variant on a connected device/emulator (`expo run:android`).
- `npm run lint` — `expo lint`.
- `npm test` — Jest (`jest-expo` preset); tests live under `src/lib/__tests__/**/*.test.ts`. Run a
  single file with `npm test -- path/to/file.test.ts`.
- `npm run db:generate` — regenerate Drizzle migrations from `src/db/schema.ts` after a schema change.
- `npx tsc --noEmit` — typecheck; Metro does not check types, so run this separately.
- **Verifying a real device build** (release APK, installed and exercised on a connected phone —
  not just the debug client talking to Metro): use the `verify-on-device` skill
  (`.claude/skills/verify-on-device/`).

## Stack

Expo / React Native + TypeScript · `expo-sqlite` + Drizzle ORM · `lucide-react-native` · `date-fns` ·
`expo-notifications` (reminders, added post-v1 — see Reminders below).
`SPEC.md` §8 flagged this as *"a recommendation, not a hard requirement"* — it has since been adopted
as-is; no deviation has been recorded in `DESIGN.md`.

The relational store was recommended specifically because the Day/Week/Month/Year views are
date-range queries with a category join.

## Domain model

Two entities, defined in `SPEC.md` §2:

- **Task** — `id`, `title`, `dueDate` (required; drives *all* sorting and grouping), `dueTime?`, `description?`, `categoryId` (nullable), `icon?` (Lucide name), `completed`, `reminderMinutesBefore?` (null = no reminder; see Reminders below), `createdAt` (tie-breaking).
- **Category** — `id`, `name` (unique), `color` (hex), `icon?`. Full CRUD.

One category per task. Tasks and categories each carry their own independent optional icon.

## Behavioral invariants

- **One unified list, never per-category sections.** The Tasks tab merges every category into a single continuous list sorted ascending by `dueDate` then `dueTime`. Category filter chips narrow the *view* only — they must never re-sort or re-group the underlying merged order.
- **Today divider.** A marker is inserted into the list at the current date: overdue above, today-and-later below. If nothing is overdue it sits at the very top. This is a derived list position, not a stored row.
- **Completed tasks stay in the list**, dimmed and struck through. They are not filtered out.
- **Category deletion always prompts** — reassign the orphaned tasks to "Uncategorized" or delete them too. Default to reassigning; never silently delete tasks.
- **One dataset, four calendar zoom levels** (Day / Week / Month / Year) over the same task data — no separate storage or shadow model per view. The viewed date persists across mode switches where meaningful (Day→Week stays in the same week).
- **Local-first, no network.** No backend, no account, no sync. Data must survive app restarts *and* updates — schema migrations are a real concern, not a future one.
- **One shared create/edit form** and a single "Add Task" entry point reachable from both tabs. Editing opens the same form pre-filled.

## Reminders

Local notifications via `expo-notifications`, added after `SPEC.md` §9 originally scoped them out.

- **Model**: a task's `reminderMinutesBefore` is an offset (`REMINDER_OPTIONS` in `src/lib/reminders.ts`
  — None / At due time / 10 min / 1 hour / 1 day before), not an absolute timestamp, so the reminder
  follows the task when its due date/time changes. A task with no `dueTime` anchors at 09:00.
- **Scheduling** (`src/lib/notifications.ts`) is keyed on the task's own id as the notification
  identifier — cancel/reschedule is a direct lookup, no separate id column. Every task mutation that
  can affect a reminder (`src/db/mutations.ts`: create, update, complete, delete, and category
  delete-with-tasks) is `async` and awaits the reminder sync, so a reminder can't be left orphaned by
  a mutation that forgot about it.
- **Permission is requested on first use, not at launch** — the moment the user picks a non-`None`
  reminder in the task form (`src/app/task-form.tsx`). A denial reverts the field to `None` rather
  than storing an offset that can never fire. Do not add a launch-time permission request; it's the
  fastest way to get permanently denied on Android 13+.
- **Exact alarms**: `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` are deliberately *not* requested.
  Live-tested on the connected Nothing A015 (Android 16): a reminder scheduled ~4 minutes out
  delivered promptly with no perceptible Doze delay. Not exhaustively verified across long idle
  periods — if reminders are reported as late/missed after real-world idle time, that's the first
  thing to revisit (add `USE_EXACT_ALARM` via `app.json` → `android.permissions`; acceptable for a
  sideloaded build, would need review for a Play Store submission).

## Design system

Full detail in `DESIGN.md`. The load-bearing parts:

- **Dark mode only.** No light theme is specified — do not invent one.
- **Tokens** (`DESIGN.md` §2), to be defined once and referenced everywhere rather than hardcoded: `bg-base` `#0D0D0D` · `bg-surface` `#1A1A1A` · `bg-surface-raised` `#232323` · `accent-primary` `#D6FF5C` (lime) · `accent-warm` `#FF9F45` · `text-primary` `#F5F5F5` · `text-secondary` `#9A9A9A` · `text-muted` `#5C5C5C` · `border-subtle` `#2A2A2A`.
- **Three type roles, not one family:** bold geometric sans for headings/day labels, humanist sans for body/task titles, and monospace **only** for numbers — dates, times, counts, year numbers. Never set a full sentence in mono.
- **Icons:** Lucide, outline only, 1.5–2px stroke. 16px inline, 20–24px nav, 28–32px picker/empty states. Category color variety comes from a curated 6–8 hue swatch, not free-form hex entry.
- **4px spacing base** (8/12/16/24/32); 16–20px radius on rows and cards; fully-rounded (999px) pills for category chips and filters.
- **Add Task is an inline button at the bottom of the list, not a FAB** — a deliberate call in §6 to avoid an FAB competing with a two-tab bar.
- **The Day/Week/Month/Year switcher is a segmented control under the Calendar header** — never a third layer of bottom navigation.
- **Motion is a later layer** (§8), explicitly not a v1 blocker.

Component specs for the task row, today divider, day/week section header, year row, month grid, category chip, and create/edit sheet are in `DESIGN.md` §6, each mapped back to a specific reference screenshot in §9.

## Open questions

Both specs flag unresolved decisions. Surface the relevant one *before* building the part it affects, not after.

- **Visual direction is unconfirmed** (`DESIGN.md` §1). The system as written deliberately departs from the cartoony Fredoka One + Nunito look used across the user's other projects, because none of the three references were cartoony. The user may want it redone to match that established style; §2–3 (color, type) would change, layout and components in §6 would carry over unchanged.
- **`SPEC.md` §9** lists five assumptions made on the user's behalf: task-level icons (vs. category-only), completed tasks staying visible, reminders out of scope, recurring tasks out of scope, and one category per task. Task-level icons and single-category-per-task are model changes that get expensive once the icon picker and schema exist. **Reminders have since been implemented** (see Reminders above) — recurring tasks and multi-category-per-task remain out of scope.
