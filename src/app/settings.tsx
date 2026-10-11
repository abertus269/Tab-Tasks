import { useRouter } from 'expo-router';
import { ChevronRight, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { requestPinWidget } from 'react-native-android-widget';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { useSettings } from '@/hooks/useSettings';
import { colors, iconSize, minTouchTarget, radius, spacing, strokeWidth } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

import { WIDGET_NAME } from '../../widget/sync';

const PIN_SUBTITLE_DEFAULT = 'Add Today’s Tasks to your home screen.';
const PIN_SUBTITLE_UNSUPPORTED = "Your launcher doesn't support this — add it from the widget picker instead.";

// SPEC.md §10/§11 — a minimal home for app-wide preferences: the
// status-box-cycles toggle, category management, and the widget pin prompt.
// Reached from a gear in the Tasks tab header.
export default function SettingsScreen() {
  const router = useRouter();
  const { tapCyclesStatus, setTapCyclesStatus } = useSettings();
  const [pinSubtitle, setPinSubtitle] = useState(PIN_SUBTITLE_DEFAULT);

  async function handleAddWidget() {
    const accepted = await requestPinWidget({ widgetName: WIDGET_NAME });
    if (!accepted) {
      setPinSubtitle(PIN_SUBTITLE_UNSUPPORTED);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton icon={X} label="Close" onPress={() => router.back()} />
        <Text style={styles.headerTitle} accessibilityRole="header">
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Status box cycles</Text>
          <Text style={styles.rowSubtitle}>
            {tapCyclesStatus
              ? 'Each tap steps through to do → active → done.'
              : 'Off: one tap marks a task done.'}
          </Text>
        </View>
        <Switch
          value={tapCyclesStatus}
          onValueChange={setTapCyclesStatus}
          trackColor={{ false: colors.borderStrong, true: colors.accentPrimary }}
          accessibilityLabel="Status box cycles through to do, active, done"
          thumbColor={colors.textPrimary}
        />
      </View>

      {/* Also reachable from the task form's category row, but that's a
          small glyph mid-form — this is where someone looks for it. */}
      <Pressable
        style={[styles.row, styles.rowSpaced]}
        onPress={() => router.push('/category-manager')}
        accessibilityRole="button"
        android_ripple={{ color: colors.borderSubtle }}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Categories</Text>
          <Text style={styles.rowSubtitle}>Rename, recolor, or delete your categories.</Text>
        </View>
        <ChevronRight size={iconSize.nav - 2} color={colors.textSecondary} strokeWidth={strokeWidth} />
      </Pressable>

      {Platform.OS === 'android' ? (
        <Pressable
          style={[styles.row, styles.rowSpaced]}
          onPress={handleAddWidget}
          accessibilityRole="button"
          android_ripple={{ color: colors.borderSubtle }}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Home screen widget</Text>
            <Text style={styles.rowSubtitle}>{pinSubtitle}</Text>
          </View>
          <Plus size={iconSize.nav - 2} color={colors.textSecondary} strokeWidth={strokeWidth} />
        </Pressable>
      ) : null}
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
    // IconButton's 48dp target already carries ~13dp of inset around the glyph.
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: minTouchTarget,
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
  rowSpaced: {
    marginTop: spacing.md,
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
