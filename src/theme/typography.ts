import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';

// DESIGN.md §3 — three type roles, never mixed:
//   heading  — headings, day labels, nav titles
//   body     — task titles, descriptions, general copy
//   mono     — numbers only (dates, times, counts, years). Never a full sentence.
export const fonts = {
  heading: 'SpaceGrotesk_700Bold',
  headingSemiBold: 'SpaceGrotesk_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  mono: 'SpaceMono_400Regular',
} as const;

export const fontModules = {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  SpaceMono_400Regular,
};

// DESIGN.md §3 — suggested scale
export const fontSize = {
  display: 30,
  heading: 21,
  body: 16,
  caption: 13,
} as const;
