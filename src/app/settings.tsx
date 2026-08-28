import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettings } from '@/hooks/useSettings';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

// SPEC.md §10/§11 — a minimal home for app-wide preferences, starting with
// the tap-cycles-status toggle. Reached from a gear in the Tasks tab header.
export default function SettingsScreen() {
  const router = useRouter();
  const { tapCyclesStatus, setTapCyclesStatus } = useSettings();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Tapping a task</Text>
          <Text style={styles.rowSubtitle}>
            {tapCyclesStatus
              ? 'Cycle through statuses: todo → in progress → done.'
              : 'Off: one tap marks a task done.'}
          </Text>
        </View>
        <Switch
          value={tapCyclesStatus}
          onValueChange={setTapCyclesStatus}
          trackColor={{ false: colors.borderSubtle, true: colors.accentPrimary }}
          thumbColor={colors.textPrimary}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  rowTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
});
