// DESIGN.md §2 — Color Palette. Dark mode only; there is no light variant.
export const colors = {
  bgBase: '#0D0D0D',
  bgSurface: '#1A1A1A',
  bgSurfaceRaised: '#232323',
  accentPrimary: '#D6FF5C',
  accentWarm: '#FF9F45',
  textPrimary: '#F5F5F5',
  textSecondary: '#9A9A9A',
  // Raised from DESIGN.md's #5C5C5C, which measured 2.6:1 on bgSurface and
  // failed WCAG AA for the text it's used on (completed titles, empty-state
  // copy, placeholders). #8A8A8A clears 4.5:1 on all three backgrounds
  // (5.6 base / 5.0 surface / 4.55 raised).
  textMuted: '#8A8A8A',
  borderSubtle: '#2A2A2A',
  // For outlines that are the *only* visual of a control (the empty todo
  // square, an input's underline) — borderSubtle is 1.2:1 there, invisible.
  // Clears the 3:1 non-text contrast floor on every background.
  borderStrong: '#6E6E6E',
  // The "Now" row — a task whose status is active. accentPrimary at ~8% over
  // bgSurface, plus a lime hairline at ~35%: a row that reads as lit without
  // a second accent color competing with the Today rule.
  bgActive: '#23281A',
  borderActive: '#536229',
  // Not specified in DESIGN.md — a soft coral for destructive actions (delete),
  // chosen to sit alongside the pastel category swatch without reading as an
  // alarm color against the dark background.
  danger: '#FF6B6B',
} as const;

// DESIGN.md §2 — curated 6–8 hue swatch users assign per category, pulled from
// reference #2's pastel set (lavender, cream/yellow, mint) plus a few more,
// tuned to stay distinct against bgBase without clashing. Lime is not one of
// them: accentPrimary means "act here / now / today", and a category badge in
// the same color read as that accent (DESIGN.md §2, lime discipline).
export const categoryColors = [
  '#C7B8FF', // lavender
  '#FFE9A8', // cream/yellow
  '#A8F0C6', // mint
  '#FFB4C6', // blush pink
  '#8FD3F4', // sky blue
  '#FFC98F', // peach
  '#B8C4FF', // periwinkle
] as const;

// Spoken names for the swatch — a color-only button has nothing else for
// TalkBack to announce. Lime stays listed: categories saved while it was still
// on offer keep their color (stored values are never rewritten).
export const categoryColorNames: Record<string, string> = {
  '#C7B8FF': 'Lavender',
  '#FFE9A8': 'Cream',
  '#A8F0C6': 'Mint',
  '#FFB4C6': 'Blush pink',
  '#8FD3F4': 'Sky blue',
  '#FFC98F': 'Peach',
  '#D6FF5C': 'Lime',
  '#B8C4FF': 'Periwinkle',
};

// DESIGN.md §4 — Spacing & Shape
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  card: 18, // 16–20px for list rows and cards
  pill: 999, // fully rounded chips/filters
} as const;

// DESIGN.md §5 — Iconography
export const iconSize = {
  inline: 16,
  nav: 22,
  picker: 28,
} as const;

export const strokeWidth = 1.75;

// Android's minimum touch target (Material: 48×48dp). Visual size can be
// smaller; the hit area (size + hitSlop) can't.
export const minTouchTarget = 48;
