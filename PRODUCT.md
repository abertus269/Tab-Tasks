# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Anyone who wants a simple personal to-do app, not a specific audience. Categories
such as Personal, Studies and Work are user-defined, and no single one is the
center of the product. The person using it manages their own tasks on their own
phone: no shared lists, no teams.

## Product Purpose

Getting today's list done. The person opens the app to see what's due today
(and what's overdue), works through it, and ticks things off. Planning ahead
(the Calendar's Day / Week / Month / Year views over the same data) supports
that daily list rather than replacing it. Success means the person checks the
app daily and trusts that nothing due today is hidden from them.

## Positioning

- One unified list, sorted by due date, with a Today divider that splits
  overdue from today and later. It is never split into per-category sections.
- A three-state task status (to do → active → done), so "what I'm doing right
  now" is distinct from "what's left".
- Local-first and private: no account, no backend, no sync.

## Operating Context

- Used one-handed on an Android phone in short sessions, often interrupted.
- A home-screen widget shows today's tasks and lets the user change a task's
  status without opening the app.
- Local reminders (an offset before the due time) bring the person back.

## Capabilities and Constraints

- Tasks: a title and due date (required); optional due time, description,
  category, icon and reminder; a status.
- One category per task, with full category CRUD. Deleting a category always
  prompts and defaults to reassigning its tasks to Uncategorized.
- Done tasks leave the Tasks tab, with undo and a Completed filter. The Calendar
  views keep showing them, struck through.
- Data must survive app restarts and updates; schema migrations are real.
- **Distribution: the Play Store, eventually.** Stay within Play policy. For
  example, `USE_EXACT_ALARM` / `SCHEDULE_EXACT_ALARM` would need justification,
  and notification permission is requested on first use, never at launch.
- Out of scope for now: recurring tasks, multiple categories per task,
  accounts, sync.

## Brand Commitments

- The name is "Tab Tasks".
- No visual brand commitments are binding. The incumbent lime-on-black look is
  evidence, not a commitment (DESIGN.md §1 flags the direction as unconfirmed).

## Evidence on Hand

- No users, testimonials or metrics yet. Nothing like that should be fabricated
  in app copy or store listings.
- The first design critique (21/40) is at
  `.impeccable/critique/2026-10-11T08-38-37Z__src-app.md`.

## Product Principles

1. **Today first.** What's due today, and what's overdue, is always the first
   thing on screen and never ambiguous.
2. **Never lose a task silently.** Every destructive or completing action can
   be undone, or is confirmed before it happens.
3. **One list, many lenses.** Filters and calendar zooms change the view and
   never the data or its order.
4. **The obvious tap does the obvious thing.** A control that looks like a
   checkbox toggles status, and tapping a task opens it.

## Accessibility & Inclusion

- Target WCAG AA contrast (4.5:1 text, 3:1 UI boundaries).
- 48dp minimum touch targets.
- A full TalkBack path: every control is labeled, task rows announce their
  status, and gestures (swipe, long-press) have equivalent accessibility
  actions. Play Store distribution makes this a release requirement, not a
  nice-to-have.
