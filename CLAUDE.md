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
- `widget/` — the home-screen widget (`react-native-android-widget`): `TodayTasksWidget.tsx` (the
  rendered widget), `widget-task-handler.tsx` (its headless task), `sync.tsx` (called from
  `src/db/mutations.ts` to push app-side edits to it). See Widget below. Entry point is `index.ts`
  (re-exports `expo-router/entry` and registers the task handler) — **not** `expo-router/entry`
  directly; `package.json`'s `main` reflects this.
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
`expo-notifications` (reminders, added post-v1 — see Reminders below) ·
`react-native-android-widget` (home-screen widget, added post-v1 — see Widget below).
`SPEC.md` §8 flagged this as *"a recommendation, not a hard requirement"* — it has since been adopted
as-is; no deviation has been recorded in `DESIGN.md`.

The relational store was recommended specifically because the Day/Week/Month/Year views are
date-range queries with a category join.

## Domain model

Two entities, defined in `SPEC.md` §2:

- **Task** — `id`, `title`, `dueDate` (required; drives *all* sorting and grouping), `dueTime?`, `description?`, `categoryId` (nullable), `icon?` (Lucide name), `status` (`'todo' | 'active' | 'done'`, default `'todo'` — cycled by tapping the row's status square, `src/lib/status.ts`), `reminderMinutesBefore?` (null = no reminder; see Reminders below), `createdAt` (tie-breaking).
- **Category** — `id`, `name` (unique), `color` (hex), `icon?`. Full CRUD.

One category per task. Tasks and categories each carry their own independent optional icon.

## Behavioral invariants

- **One unified list, never per-category sections.** The Tasks tab merges every category into a single continuous list sorted ascending by `dueDate` then `dueTime`. Category filter chips narrow the *view* only — they must never re-sort or re-group the underlying merged order.
- **Today divider.** A marker is inserted into the list at the current date: overdue above, today-and-later below. If nothing is overdue it sits at the very top. This is a derived list position, not a stored row.
- **Done tasks leave the Tasks tab's list.** Swiping a row either direction, or tapping its status square to `done`, plays an exit animation — slide out, then collapse (`SwipeableTaskRow`'s `completeBehavior="exit"`) — before the status write lands, and shows a 5s "Task completed · Undo" toast that restores the previous status. The undo slot is app-wide (`src/store/undo.ts`), not per-screen, so a delete from the task form's "Delete task" button surfaces its Undo on whichever list the form returns to. A trailing **Completed** filter chip (mutually exclusive with category chips, no Today/Upcoming dividers — `src/lib/filters.ts`) shows only done tasks, struck through; tapping or swiping one there reopens it the same way. **Calendar's Day/Week agendas still show done tasks in place**, dimmed and struck through — swiping there (`completeBehavior="toggle"`) just flips the status and springs back, no exit animation, no toast.
- **Two tap targets per task row.** The status square is its own 48dp button that cycles `todo → active → done` (or toggles done, with the `tapCyclesStatus` setting off — same setting the widget's square reads). Tapping anywhere else on the row opens the task in the edit form. This replaced "tap the row to cycle status", which a first-time user hit when they were trying to open a task. Long-press still opens the Edit/Delete menu, and swipe is unchanged.
- **The task form never discards edits silently.** `usePreventRemove` intercepts X and hardware/gesture Back while the form is dirty and shows `DiscardChangesPrompt`.
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

## Widget

Android home-screen widget via `react-native-android-widget`, added after `SPEC.md` §10 originally
scoped it to swipe-to-complete. **Swipe was dropped**: Android widgets (`RemoteViews`) support only
tap and vertical-scroll — there is no per-row swipe gesture at any layer of the platform. Confirmed
against `developer.android.com`'s app widget docs, not assumed.

- **Interaction**: tapping a task row's status square (`StatusIndicator` in
  `widget/TodayTasksWidget.tsx`) cycles `todo → active → done` — the same cycle and the same
  `tapCyclesStatus` setting (`src/hooks/useSettings.ts`) as tapping a row in-app, read fresh on every
  tap via `getTapCyclesStatusSetting` (`src/lib/widgetData.ts`). Tapping the rest of the row deep-links
  to `tabtasks://task-form?id=<uuid>` (`clickAction: 'OPEN_URI'`, handled natively before JS runs).
  Both are nested clickables inside one `ListWidget` row — the library's documented pattern for
  per-item click regions inside a collection widget.
- **Data**: `widget/widget-task-handler.tsx` is the library's headless-task entry (runs on
  `WIDGET_ADDED`/`WIDGET_UPDATE`/`WIDGET_RESIZED`/`WIDGET_CLICK`). It reuses `setTaskStatus`
  (`src/db/mutations.ts`) for the status-cycle click rather than writing SQL directly, so reminder
  cancel/reschedule (`syncTaskReminder`) fires exactly as it does from the app UI — no separate
  native reminder logic to keep in sync. "Today's tasks" is one shared query
  (`getTodayTasksForWidget`, `src/lib/widgetData.ts`) used by both the headless task and the
  app-side sync path below, so the two surfaces can't disagree on what counts as "today." A `done`
  task stays in that query's result (sorted after every not-done task) instead of being filtered
  out — the widget has no undo toast like the Tasks tab's, so tapping a row into `done` needs to stay
  reachable for a tap back, per `SPEC.md` §10's "toggle to doing/complete/original state." The
  headless path can run before `src/app/_layout.tsx` ever has (widget placed pre-first-launch, or a
  periodic tick after an update ships a migration the app hasn't been opened to apply) —
  `widgetData.ts`'s `ensureDbReady()` runs drizzle's non-hook `migrate()` before every query rather
  than assuming `useMigrations` already ran, and the handler falls back to a tap-to-open-app widget
  state on any thrown error instead of rendering blank.
- **App → widget sync**: the widget only re-queries on its own events, so it has no way to learn
  about an edit made in the app. `widget/sync.tsx`'s `syncWidget()` (native `requestWidgetUpdate`,
  Android-only — no-ops on web) is called from every task mutation in `src/db/mutations.ts` that can
  change today's list: create, update, status change, delete, restore, and category
  delete-with-tasks. It also fires on a 30-minute `updatePeriodMillis` floor (Android's minimum) so
  the list rolls over at midnight even with the app untouched. Every mutation `await`s it, so it
  swallows and logs its own errors rather than risk a widget-render failure surfacing as a failed
  task save.
- **Sizes**: one widget (`TodayTasks`), default 2×2 (`targetCellWidth/Height`), resizable from 2×2
  up to 4×4 (`minWidth/Height` and `maxResizeWidth/Height` all in Android's `70n − 30dp` cell
  formula, `resizeMode: "horizontal|vertical"`) — covers both shapes `SPEC.md` asked for from a
  single definition rather than two separate widgets. A "Home screen widget" row in
  `src/app/settings.tsx` calls `requestPinWidget` to trigger the launcher's native add-widget prompt,
  Android-only, with a fallback message if the launcher doesn't support it.
- **Fonts**: the widget can't use the app's runtime-loaded `@expo-google-fonts/*` packages — Android
  widget text needs its font shipped as a file. The three faces it uses
  (`Inter_500Medium`, `SpaceMono_400Regular`, `SpaceGrotesk_600SemiBold`) are copied into
  `assets/fonts/` and declared in the plugin's `fonts` array in `app.json`; an unlisted `fontFamily`
  silently falls back to the system font rather than erroring, so a missing font here is easy to miss
  — check the widget visually after touching fonts.
- **Verified on RN 0.86 / Expo SDK 57**: `react-native-android-widget`'s own compatibility docs stop
  at RN 0.83, so this was a real risk, not a formality — confirmed by a release-build compile+package
  spike before the real widget was built.
- **Verified on-device** (release build, Nothing A015 / Android 16, via the `verify-on-device`
  skill plus a widget-specific pass on top): status-tap cycling, the done-stays-visible-dimmed
  behavior, the `tabtasks://task-form?id=` deep link (including from a fully cold app process),
  app→widget sync with no widget interaction, and the Settings pin-widget flow (`requestPinWidget`)
  all confirmed working. One real platform edge case found: `adb shell am force-stop` (or the
  equivalent user action, Settings → App info → Force stop) puts the app package in Android's
  "stopped" state, which blocks the implicit broadcasts (`WIDGET_UPDATE`/`WIDGET_CLICK`) that
  the widget's headless task relies on — the widget is stuck on its loading placeholder and
  unresponsive to taps until the user opens the app normally, which clears the stopped state and
  the widget recovers immediately. This is Android platform behavior (broadcast restrictions on
  stopped packages, since Android 3.1), not a bug in this widget's code, and would affect any
  third-party home-screen widget identically; a normal OS-initiated background kill (low memory)
  does not set this flag, so it's a narrow, user-initiated edge case, not the common path.

## Design system

Full detail in `DESIGN.md`. The load-bearing parts:

- **Dark mode only.** No light theme is specified — do not invent one.
- **Tokens** (`DESIGN.md` §2), to be defined once and referenced everywhere rather than hardcoded: `bg-base` `#0D0D0D` · `bg-surface` `#1A1A1A` · `bg-surface-raised` `#232323` · `accent-primary` `#D6FF5C` (lime) · `accent-warm` `#FF9F45` · `text-primary` `#F5F5F5` · `text-secondary` `#9A9A9A` · `text-muted` `#8A8A8A` (raised from DESIGN.md's `#5C5C5C`, which failed WCAG AA) · `border-subtle` `#2A2A2A` · `border-strong` `#6E6E6E` (outlines that are a control's only visual, e.g. the empty status square, need ≥3:1) · `bg-active` / `border-active` (the lime-tinted "Now" row for an active task).
- **Three type roles, not one family:** bold geometric sans for headings/day labels, humanist sans for body/task titles, and monospace **only** for numbers — dates, times, counts, year numbers. Never set a full sentence in mono. Mixed labels ("Oct 26 · 10:00 AM", "3 left today") go through `src/components/DataText.tsx`, which sets only the digit runs in mono.
- **Icons:** Lucide, outline only, 1.5–2px stroke. 16px inline, 20–24px nav, 28–32px picker/empty states. The curated set lives in `src/lib/icons.ts` as ~100 names grouped by theme (the picker renders one section header per group); keys are stored verbatim on tasks/categories, so a key must never be renamed or removed once shipped. Category color variety comes from a curated 6–8 hue swatch, not free-form hex entry.
- **4px spacing base** (8/12/16/24/32); 16–20px radius on rows and cards; fully-rounded (999px) pills for category chips and filters.
- **Accessibility floor (PRODUCT.md, Play Store-bound):** 48dp touch targets (`minTouchTarget`; icon-only controls go through `src/components/IconButton.tsx`, which requires a `label`), every control labeled for TalkBack, and task rows announce title, status, category and due date as one label.
- **Add Task is an inline button at the bottom of the list, not a FAB** — a deliberate call in §6 to avoid an FAB competing with a two-tab bar.
- **The Day/Week/Month/Year switcher is a segmented control under the Calendar header** — never a third layer of bottom navigation.
- **Motion is a later layer** (§8), explicitly not a v1 blocker.

Component specs for the task row, today divider, day/week section header, year row, month grid, category chip, and create/edit sheet are in `DESIGN.md` §6, each mapped back to a specific reference screenshot in §9.

## Open questions

Both specs flag unresolved decisions. Surface the relevant one *before* building the part it affects, not after.

- **Visual direction — settled 2026-10-11.** After an on-device design critique the user kept the lime-on-black system (no cartoony redo) and chose a general to-do app **built around Today**, not a student/exam tool: the Tasks tab opens on a Today header (`src/components/TodayHeader.tsx`), the Today divider is full-strength, and an active task reads as a lime-tinted "Now" row. Product truth for that call lives in `PRODUCT.md`; don't reintroduce exam/countdown framing.
- **`SPEC.md` §9** lists five assumptions made on the user's behalf: task-level icons (vs. category-only), completed tasks staying visible, reminders out of scope, recurring tasks out of scope, and one category per task. Task-level icons and single-category-per-task are model changes that get expensive once the icon picker and schema exist. **Reminders have since been implemented** (see Reminders above) — recurring tasks and multi-category-per-task remain out of scope. **The "completed tasks stay visible" assumption has since been overridden** on the user's explicit request — see the Behavioral invariants bullet above.
