# DESIGN.md — Visual Design System

## 1. Direction

Derived from the three reference screenshots. The three lean toward different
identities — a minimal lime-on-black utility feel, a warm illustrated
productivity feel, and a glassy purple/gradient SaaS-dashboard feel — so this
doc pulls one coherent system out of what they share, biased toward the
simplest of the three since the brief is a "simple to-do app."

**Refined (2026-10-17):** after a second critique the Today-first idea held, and three things were tightened: lime now means one thing (see §2), the active task lives in a pinned Now card instead of glowing in place, and the Calendar's Week and Year views stopped being lists of mostly-empty buckets (see §6).

**Settled (2026-10-11):** this system stays, and it does not take on the
cartoony Fredoka/Nunito look of the user's other projects. Its signature is
**Today**. The Tasks tab opens on the day itself (Today header), the Today
divider is the list's one full-strength landmark, and an active task glows as
a "Now" row. See PRODUCT.md for the product reasoning.

## 2. Color Palette

Dark mode only — all three references are dark, and none show a light theme.

| Token | Value | Used for |
|---|---|---|
| `bg-base` | `#0D0D0D` | app background |
| `bg-surface` | `#1A1A1A` | cards, list rows |
| `bg-surface-raised` | `#232323` | modals, the task-creation sheet |
| `accent-primary` | `#D6FF5C` (lime) | "act here / now / today" only — see the lime rule below |
| `accent-warm` | `#FF9F45` | secondary accent — category color variety, not the primary CTA |
| `text-primary` | `#F5F5F5` | titles, primary copy |
| `text-secondary` | `#9A9A9A` | metadata (dates, times, counts) |
| `text-muted` | `#8A8A8A` | completed-task strikethrough, placeholders, empty-state copy (was `#5C5C5C`, 2.6:1, which failed AA; now ≥4.5:1 on every surface) |
| `border-subtle` | `#2A2A2A` | card outlines, dividers (decorative only) |
| `border-strong` | `#6E6E6E` | an outline that *is* the control (empty status square, input underline, switch off-track): ≥3:1 |
| `bg-active` | `#23281A` | the Now card (and the tinted active row in Calendar agendas) |
| `border-active` | `#536229` | hairline around the "Now" row |
| `divider-today` | `accent-primary`, full strength, 2px | the "Today" rule in the Tasks tab |

`accent-warm` also marks lateness: an overdue task's due date and the
header's overdue count — and nothing else. The Month grid's task dots are
neutral (`text-secondary`), because the grid can't tell late from on time.

**The lime rule.** `accent-primary` means "act here / now / today" and
nothing else: the primary action (Add task, Save), the Today rule and the
Today ring (header, Month grid, Week strip, current month tile), the active
tab, the Now card, and the one-beat check when a task is finished.
*Selection* is neutral-inverse — a `text-primary` fill with `bg-base` text —
on filter chips, the Day/Week/Month/Year control, and the Month grid's
selected date. A *finished* task is a quiet `text-muted` check, so the
Completed filter is the calmest screen in the app. The category swatch has
no lime in it, so a category badge never reads as the accent.

Category colors: a curated 6–8 hue swatch users assign per category — pull
from the pastel set in reference #2 (lavender, cream/yellow, mint) plus 2–3
more, so categories stay distinct against the dark background without
clashing.

## 3. Typography

- **Headings / day labels / nav titles:** a bold geometric sans (e.g. *Space
  Grotesk* or *Manrope*, Bold/SemiBold) — matches the confident, squared-off
  "Monday" headline in reference #1.
- **Body / task titles / descriptions:** a clean humanist sans (e.g. *Inter*,
  Regular/Medium).
- **Metadata accent (dates, times, counts, year numbers):** a monospace (e.g.
  *Space Mono* or *JetBrains Mono*) — the detail that gives reference #1 its
  "utility tool" feel. Use it only for numbers/timestamps, never full
  sentences.

Suggested scale: Display 28–32 / Heading 20–22 / Body 15–16 / Caption 12–13.

## 4. Spacing & Shape

- Base spacing unit: 4px (multiples throughout: 8, 12, 16, 24, 32).
- Card/row radius: 16–20px for list rows and cards.
- Chip/pill radius: fully rounded (999px) for category tags and filters.
- Generous internal padding (16–20px) — all three references favor breathing
  room over density.

## 5. Iconography

- **Lucide icons** throughout, 1.5–2px stroke, outline (not filled), matching
  the clean line-icon language across all three references.
- Sizes: 16px inline (chips/rows), 20–24px for nav/section icons, 28–32px for
  the icon picker grid and empty states.
- Category chip = colored dot or filled rounded-square badge + Lucide glyph +
  name — a simplified, solid-color-and-line-icon version of reference #2's
  illustrated cards, so it stays buildable without a custom illustration set.
- **Icon picker grid:** 5 columns of 56px cells (28px glyphs), grouped into
  themed sections with a small caption-size header above each — one
  searchable scrolling list, not a paged/tabbed picker.

## 6. Core Components

**Task row** *(Tasks tab, Day view, Week view)*
Two tap targets. The status square is its own 48dp button: an empty
`border-strong` outline for to do, a lime outline with a dot for active, a
filled `text-muted` square with a check for done. One tap finishes the task
(the cycle through Now is an opt-in setting); finishing plays a lime check
for ~150ms, then the row slides out. It springs (scales down, then back up)
on every status change, except under the system's reduced-motion setting.
Tapping anywhere else opens the task. The title takes up to two lines and the
meta line wraps, so nothing escapes the card at large system font sizes. Then come an optional task icon (its column is reserved even when
empty, so titles align), the title (`text-primary`; strikethrough +
`text-muted` when done), and a meta line: "Now" (active only), category
chip, due date/time (`text-secondary`, numerals in mono via `DataText`;
`accent-warm` when overdue), and a reminder bell. An active task on the Tasks tab sits flat inside the Now card (below);
in the Calendar agendas it keeps a `bg-active` row with a `border-active`
hairline and the spelled-out "Now".

**Today header** *(Tasks tab, top)*
Replaces the "Tasks" title, which the tab bar already shows. The day name
is set at display size in the heading face. Under it runs one meta line:
date · "3 left today" / "All done today" (lime) / "Clear day" · "2 done" ·
"1 overdue" (`accent-warm`). Its counts cover every category, whatever
filter is active.

**Today divider**
The list's landmark. "Today" sits left-aligned in the semibold heading
face, `accent-primary`, followed by a 2px full-strength lime rule.
"Upcoming" has the same shape, quieter: `text-secondary` label and a 1px
`border-subtle` rule.

**Now card** *(Tasks tab, above the dated list)*
The active tasks, pinned wherever their due dates fall: one `bg-active`
card with a `border-active` hairline, a lime "Now" label (with a mono count
when there are two or more), and the tasks as flat rows — no row surface
inside the card, because cards never nest. It sits above the Today divider,
so the divider stays the dated list's landmark. A task gets here through
long-press → Start, and leaves through Pause or by finishing. The card
respects the category filter and is absent under the Completed filter.

**Day/Week section header**
Large day name (heading font) + date subtext (`text-secondary`) — modeled
directly on reference #1's "Monday / July 21 · 10:30am" block.

**Week view**
One week on one screen. Prev/next arrows step a week under a range label
("Oct 11 – 17"). Below, a strip of the seven days: weekday letters, the date
in mono, a neutral dot when the day has tasks, a lime ring on today; tapping
a day opens it in Day. Under the strip, the week's agenda lists only the days
that have tasks, each with the Day/Week section header. A week with nothing
in it says so once.

**Year view**
One year as twelve month tiles in a 3-column grid, under prev/next arrows
and the year as the label. Each tile has the month name and, only when
there are tasks, a mono count; the current month is ringed in lime. Tapping a
tile opens that month. A tile is a `bg-surface` card, 48dp+ tall.

**Month grid**
Standard 7-column calendar with two-letter weekday labels (Su Mo Tu We Th Fr
Sa) in the body face. Day numbers are mono. Selected date: a solid
neutral-inverse (`text-primary`) circle behind the number (reference #3's
month-strip, expanded to a full month). Today: a 2px `accent-primary` ring,
so it holds its own next to a selection. Dates with tasks get a 6px neutral
dot. A month is only as tall as it needs (4–6 weeks), and the cells before the
1st and after the last day are blank.

**Category chip / filter pill**
Rounded-full pill. Unselected: `border-subtle` outline, `text-secondary`
label. Unselected outlines use `border-strong`. Selected: solid fill in the category's color — or neutral-inverse (`text-primary`) when the chip has none, as with All and the reminder options — with
dark text for contrast — matches reference #2's filter row (All / Projects /
Study / Sports).

**Add Task button**
A 48dp `accent-primary` pill with a `+` and "Add task" at body size,
inline at the bottom of the list (reference #1's "Add new task" pattern —
fits the Tasks tab well), not a floating action button — it fits the
"simple" brief better and avoids an FAB competing with a two-tab bar. That
call was reconsidered and kept on 2026-10-17.

**Task create/edit form**
Full-screen sheet. Labeled fields with a subtle underline or boxed input
style (reference #2). Category selection reuses the filter-pill component
plus a trailing "+ Add category" pill. Primary action: full-width,
`accent-primary` fill, `bg-base` text, bottom-anchored above the keyboard
("Save task", dimmed until there is a title). Enter on the title field saves.
Every control is at least 48dp.

**Empty state** *(a day/week/month/year with no tasks)*
Not shown in any reference — keep it simple: muted icon + one line of
`text-secondary` copy + the Add Task affordance.

## 7. Navigation & Layout

- Bottom tab bar, two tabs: **Tasks** and **Calendar**. Active tab: icon +
  label in `accent-primary`; inactive: `text-secondary`.
- The Day/Week/Month/Year switcher lives as a segmented control directly
  under the Calendar tab's header — not as a third layer of bottom nav. Its
  selected segment is neutral-inverse, and each segment is a full 48dp target.

## 8. Motion (light touch, not required for v1)

- Checkbox completion: quick fill + checkmark draw-in, strikethrough
  animates in (~150–200ms).
- Swipe-to-complete (Tasks tab): lime backdrop + checkmark reveal under the
  drag, standard reveal-and-confirm pattern; past the ~40% threshold the row
  slides fully off (180ms) then collapses (140ms) before the status write
  and an undo toast — the same exit long-press → Delete replays. Calendar's
  Day/Week agendas keep the reveal-and-confirm without the exit: the row
  just springs back once the status flips.
- Reduced motion: when the system asks for it, the status-square spring, the
  swipe exit, the long-press lift and the undo toast's slide are all cut.
- Tab/view switches: simple crossfade or slide — the references are static
  mocks, so treat motion as a later layer, not a blocker.

## 9. Reference Mapping

- **Image 1** (lime-on-black, monospace accents) — primary source for the
  Tasks-tab layout, the today-divider concept, the day-header block, and the
  count-list pattern reused for Year view.
- **Image 2** (warm orange, illustrated category cards) — source for the
  filter-pill/category-chip pattern, the task-creation form field styling,
  and the category-color variety idea.
- **Image 3** (purple glass, gradient dashboard) — source for the
  month-calendar-strip → grid pattern and the general dark-card-on-dark
  layering. Its stats/progress-ring elements aren't part of this app's
  feature set and were left out.