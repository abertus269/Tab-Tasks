import type { LucideIcon } from 'lucide-react-native';
import { CalendarX } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  message: string;
  icon?: LucideIcon;
}

// DESIGN.md §6 — not shown in any reference; kept simple: muted icon + one
// line of text-secondary copy. The Add Task affordance lives just below this
// in the list it's rendered inside, so it isn't duplicated here.
export function EmptyState({ message, icon: Icon = CalendarX }: Props) {
  return (
    <View style={styles.container}>
      <Icon size={32} color={colors.textMuted} strokeWidth={1.5} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
