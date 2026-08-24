// DESIGN.md §2 — Color Palette. Dark mode only; there is no light variant.
export const colors = {
  bgBase: '#0D0D0D',
  bgSurface: '#1A1A1A',
  bgSurfaceRaised: '#232323',
  accentPrimary: '#D6FF5C',
  accentWarm: '#FF9F45',
  textPrimary: '#F5F5F5',
  textSecondary: '#9A9A9A',
  textMuted: '#5C5C5C',
  borderSubtle: '#2A2A2A',
  // Not specified in DESIGN.md — a soft coral for destructive actions (delete),
  // chosen to sit alongside the pastel category swatch without reading as an
  // alarm color against the dark background.
  danger: '#FF6B6B',
} as const;

// DESIGN.md §2 — curated 6–8 hue swatch users assign per category, pulled from
// reference #2's pastel set (lavender, cream/yellow, mint) plus a few more,
// tuned to stay distinct against bgBase without clashing.
export const categoryColors = [
  '#C7B8FF', // lavender
  '#FFE9A8', // cream/yellow
  '#A8F0C6', // mint
  '#FFB4C6', // blush pink
  '#8FD3F4', // sky blue
  '#FFC98F', // peach
  '#D6FF5C', // lime (accentPrimary — offered as an option too)
  '#B8C4FF', // periwinkle
] as const;

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
