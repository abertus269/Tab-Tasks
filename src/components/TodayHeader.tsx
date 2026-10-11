import { format } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';

import { DataText } from '@/components/DataText';
import { colors, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

interface Props {
  today: Date;
  leftToday: number;
  doneToday: number;
  overdue: number;
}

// The Tasks tab opens on the day itself, not on the word "Tasks" (the tab bar
// already says that). Day name large; under it the date and the state of
// today's list, so "how is today going" is answered before any row is read.
// Modeled on DESIGN.md §6's day-section header (reference #1's
// "Monday / July 21" block).
export function TodayHeader({ today, leftToday, doneToday, overdue }: Props) {
  const status =
    leftToday === 0 && doneToday > 0
      ? 'All done today'
      : leftToday === 0
        ? 'Clear day'
        : `${leftToday} left today`;

  const spoken = [format(today, 'EEEE, MMMM d'), status, doneToday > 0 ? `${doneToday} done` : null, overdue > 0 ? `${overdue} overdue` : null]
    .filter(Boolean)
    .join(', ');

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={spoken} style={styles.container}>
      <Text style={styles.day}>{format(today, 'EEEE')}</Text>
      <View style={styles.metaRow}>
        <DataText style={styles.meta}>{format(today, 'MMM d')}</DataText>
        <Text style={styles.sep}>·</Text>
        <DataText style={[styles.meta, leftToday === 0 && doneToday > 0 && styles.allDone]}>{status}</DataText>
        {doneToday > 0 && leftToday > 0 && (
          <>
            <Text style={styles.sep}>·</Text>
            <DataText style={styles.meta}>{`${doneToday} done`}</DataText>
          </>
        )}
        {overdue > 0 && (
          <>
            <Text style={styles.sep}>·</Text>
            <DataText style={[styles.meta, styles.overdue]}>{`${overdue} overdue`}</DataText>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  day: {
    fontFamily: fonts.heading,
    fontSize: fontSize.display,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  meta: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  sep: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  allDone: {
    color: colors.accentPrimary,
  },
  overdue: {
    color: colors.accentWarm,
  },
});
