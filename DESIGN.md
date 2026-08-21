# DESIGN.md — Visual Design System

## 1. Direction

Derived from the three reference screenshots. The three lean toward different
identities — a minimal lime-on-black utility feel, a warm illustrated
productivity feel, and a glassy purple/gradient SaaS-dashboard feel — so this
doc pulls one coherent system out of what they share, biased toward the
simplest of the three since the brief is a "simple to-do app."

**Note:** this is a deliberate departure from the cartoony, Adventure-Time /
Duolingo-inspired look (Fredoka One + Nunito, thick outlines, chunky button
shadows) that's shown up across your other projects — none of these three
references lean cartoony. If you'd rather this app match that established
look instead, say so and I'll redo §2–3; the layout and component structure
below would carry over unchanged either way.

## 2. Color Palette

Dark mode only — all three references are dark, and none show a light theme.

| Token | Value | Used for |
|---|---|---|
| `bg-base` | `#0D0D0D` | app background |
| `bg-surface` | `#1A1A1A` | cards, list rows |
| `bg-surface-raised` | `#232323` | modals, the task-creation sheet |
| `accent-primary` | `#D6FF5C` (lime) | primary CTA, active states, completion check |
| `accent-warm` | `#FF9F45` | secondary accent — category color variety, not the primary CTA |
| `text-primary` | `#F5F5F5` | titles, primary copy |
| `text-secondary` | `#9A9A9A` | metadata (dates, times, counts) |
| `text-muted` | `#5C5C5C` | completed-task strikethrough text |
| `border-subtle` | `#2A2A2A` | card outlines, dividers |
| `divider-today` | `accent-primary`, reduced opacity | the "today" line in Tasks tab |

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

## 6. Core Components

**Task row** *(Tasks tab, Day view, Week view)*
Checkbox (empty rounded-square outline → filled `accent-primary` with check
on completion) · title (`text-primary`, strikethrough + `text-muted` when
complete) · category chip · due time (`text-secondary`, mono) · optional
task icon.

**Today divider**
A thin rule spanning the list width, optionally with a small centered
"Today" label in `accent-primary`. Reference #1's plain subtle line is
enough on its own; the label is an optional clarity add.

**Day/Week section header**
Large day name (heading font) + date subtext (`text-secondary`) — modeled
directly on reference #1's "Monday / July 21 · 10:30am" block.

**Year list row**
Large year number (heading font) + small task-count badge + trailing
chevron — structurally identical to reference #1's stacked Tuesday /
Wednesday / Thursday / Friday rows, reused one level up.

**Month grid**
Standard 7-column calendar. Selected date: solid `accent-primary` (or
`accent-warm`) filled circle behind the number (reference #3's month-strip,
expanded to a full month). Dates with tasks get a small dot indicator.

**Category chip / filter pill**
Rounded-full pill. Unselected: `border-subtle` outline, `text-secondary`
label. Selected: solid fill in the category's (or `accent-primary`'s) color,
dark text for contrast — matches reference #2's filter row (All / Projects /
Study / Sports).

**Add Task button**
A circular `+` button in `accent-primary`, either inline at the bottom of
the list (reference #1's "Add new task" pattern — fits the Tasks tab well)
or as a floating action button above the tab bar (reference #2/#3's
pattern). Recommend the inline version — it fits the "simple" brief better
and avoids an FAB competing with a two-tab bar.

**Task create/edit form**
Full-screen sheet. Labeled fields with a subtle underline or boxed input
style (reference #2). Category selection reuses the filter-pill component
plus a trailing "+ Add category" pill. Primary action: full-width,
`accent-primary` fill, `bg-base` text, bottom-anchored.

**Empty state** *(a day/week/month/year with no tasks)*
Not shown in any reference — keep it simple: muted icon + one line of
`text-secondary` copy + the Add Task affordance.

## 7. Navigation & Layout

- Bottom tab bar, two tabs: **Tasks** and **Calendar**. Active tab: icon +
  label in `accent-primary`; inactive: `text-secondary`.
- The Day/Week/Month/Year switcher lives as a segmented control directly
  under the Calendar tab's header — not as a third layer of bottom nav.

## 8. Motion (light touch, not required for v1)

- Checkbox completion: quick fill + checkmark draw-in, strikethrough
  animates in (~150–200ms).
- Swipe-to-delete: standard reveal-and-confirm pattern.
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