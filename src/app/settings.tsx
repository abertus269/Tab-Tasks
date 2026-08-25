import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { CircleAlert, CircleCheck, Download, Upload, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImportModePrompt } from '@/components/ImportModePrompt';
import { importBackup, readAllForBackup, type ImportMode } from '@/db/backup';
import { parseBackup, type BackupFile } from '@/lib/backup';
import { todayString } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

type Status = { type: 'success' | 'error'; message: string } | null;

// SPEC.md §10's "Settings:" bullet — a home for app-wide data actions, and
// for the theming / tap-to-cycle toggle to land in later. Reached via the
// gear next to the Tasks title, same idiom as CategoryPicker's Settings2
// glyph opening category-manager.
export default function SettingsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupFile | null>(null);

  async function handleExport() {
    setStatus(null);
    setBusy(true);
    try {
      const backup = readAllForBackup();
      const file = new File(Paths.cache, `tab-tasks-${todayString()}.json`);
      file.write(JSON.stringify(backup, null, 2));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Tab Tasks backup',
        });
      }
      setStatus({
        type: 'success',
        message: `Exported ${backup.tasks.length} tasks, ${backup.categories.length} categories.`,
      });
    } catch {
      setStatus({ type: 'error', message: 'Export failed. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  async function handlePickImport() {
    setStatus(null);
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (picked.canceled) return;

    try {
      const raw = await new File(picked.assets[0].uri).text();
      const result = parseBackup(raw);
      if (!result.ok) {
        setStatus({ type: 'error', message: result.error });
        return;
      }
      setPendingImport(result.data);
    } catch {
      setStatus({ type: 'error', message: 'Could not read that file.' });
    }
  }

  async function handleConfirmImport(mode: ImportMode) {
    const backup = pendingImport;
    setPendingImport(null);
    if (!backup) return;

    setBusy(true);
    try {
      const result = await importBackup(backup, mode);
      setStatus({
        type: 'success',
        message: `Imported ${result.tasksImported} tasks, ${result.categoriesImported} categories.`,
      });
    } catch {
      setStatus({ type: 'error', message: 'Import failed. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Data</Text>

        <Pressable onPress={handleExport} disabled={busy} style={styles.row}>
          <Upload size={18} color={colors.textPrimary} strokeWidth={1.75} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Export backup</Text>
            <Text style={styles.rowSubtitle}>Save every task and category to a file</Text>
          </View>
        </Pressable>

        <Pressable onPress={handlePickImport} disabled={busy} style={styles.row}>
          <Download size={18} color={colors.textPrimary} strokeWidth={1.75} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Import backup</Text>
            <Text style={styles.rowSubtitle}>Restore from a previously exported file</Text>
          </View>
        </Pressable>

        {status && (
          <View style={styles.statusRow}>
            {status.type === 'success' ? (
              <CircleCheck size={16} color={colors.accentPrimary} strokeWidth={1.75} />
            ) : (
              <CircleAlert size={16} color={colors.danger} strokeWidth={1.75} />
            )}
            <Text style={[styles.statusText, status.type === 'error' && styles.statusTextError]}>
              {status.message}
            </Text>
          </View>
        )}
      </View>

      <ImportModePrompt backup={pendingImport} onClose={() => setPendingImport(null)} onConfirm={handleConfirmImport} />
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
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  statusText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
  },
  statusTextError: {
    color: colors.danger,
  },
});
