# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This is a **greenfield, spec-only repository**. It currently contains three documents and no source code:

- `SPEC.md` — authoritative functional specification (what the app does).
- `DESIGN.md` — authoritative visual design system (what it looks like), derived from three reference screenshots.
- `CLAUDE.md` — this file.

There is no `package.json`, no test runner, and no git repository. Nothing has been scaffolded. Read both `SPEC.md` and `DESIGN.md` before any work; this file summarizes the constraints that are easy to violate, not the full contents.

## Commands

None yet — there is no toolchain to invoke. **After scaffolding, replace this section** with the real build / run / lint / test commands, including how to run a single test. Do not invent commands before the toolchain exists; verify against the generated `package.json`.

## Stack (recommended, not decided)

`SPEC.md` §8 is explicitly labelled *"A recommendation, not a hard requirement"*:
Expo / React Native + TypeScript · `expo-sqlite` (+ Drizzle ORM) · Zustand or React Query · `lucide-react-native` · `date-fns`.

The relational store is recommended specifically because the Day/Week/Month/Year views are date-range queries with a category join. If a different stack is chosen, record the decision and its rationale in `DESIGN.md`.

## Domain model

Two entities, defined in `SPEC.md` §2:

- **Task** — `id`, `title`, `dueDate` (required; drives *all* sorting and grouping), `dueTime?`, `description?`, `categoryId` (nullable), `icon?` (Lucide name), `completed`, `createdAt` (tie-breaking).
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
- **`SPEC.md` §9** lists five assumptions made on the user's behalf: task-level icons (vs. category-only), completed tasks staying visible, reminders out of scope, recurring tasks out of scope, and one category per task. Task-level icons and single-category-per-task are model changes that get expensive once the icon picker and schema exist.
