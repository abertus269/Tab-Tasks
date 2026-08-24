import { useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { YearRow } from '@/components/YearRow';
import { useYearCounts } from '@/hooks/useTasks';
import { currentYearString } from '@/lib/dates';
import { spacing } from '@/theme/tokens';

interface Props {
  onSelectYear: (year: string) => void;
}

interface YearItem {
  year: string;
  count: number;
}

const YEARS_BACK = 10;
const YEARS_FORWARD = 10;

// SPEC.md §5.4, extended per user request: a continuously scrollable range of
// years around the current one — not only years that already have tasks —
// each showing its task count. Opens scrolled to the current year.
export function YearListView({ onSelectYear }: Props) {
  const listRef = useRef<FlatList<YearItem>>(null);
  const counts = useYearCounts();

  const years: YearItem[] = useMemo(() => {
    const current = Number(currentYearString());
    const countMap = new Map(counts.map((c) => [c.year, c.count]));
    const result: YearItem[] = [];
    for (let y = current - YEARS_BACK; y <= current + YEARS_FORWARD; y++) {
      const yearStr = String(y);
      result.push({ year: yearStr, count: countMap.get(yearStr) ?? 0 });
    }
    return result;
  }, [counts]);

  const initialIndex = useMemo(() => {
    const idx = years.findIndex((y) => y.year === currentYearString());
    return idx === -1 ? 0 : idx;
  }, [years]);

  return (
    <FlatList
      ref={listRef}
      data={years}
      keyExtractor={(y) => y.year}
      initialScrollIndex={initialIndex}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <YearRow year={item.year} taskCount={item.count} onPress={() => onSelectYear(item.year)} />
      )}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 50);
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, flexGrow: 1 },
  separator: { height: spacing.sm },
});
