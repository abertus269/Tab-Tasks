import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bell, Calendar, Check, Clock, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryPicker } from '@/components/CategoryPicker';
import { DynamicIcon } from '@/components/DynamicIcon';
import { IconPicker } from '@/components/IconPicker';
import { createTask, deleteTask, updateTask } from '@/db/mutations';
import { useTask } from '@/hooks/useTasks';
import { formatDateLabel, formatTime12h, parseDateString, toDateString, todayString } from '@/lib/dates';
import { ensureNotificationPermission } from '@/lib/notifications';
import { cycleReminderOption, reminderLabel } from '@/lib/reminders';
import type { TaskWithCategory } from '@/lib/types';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

// SPEC.md §6 — Title (required) · Due date (required) · Due time (optional) ·
// Description (optional) · Category · Icon. Save / Cancel / Delete-when-editing.
// One screen handles both create and edit, reached from both tabs.
//
// The record being edited loads asynchronously from the DB (useTask), so
// TaskFormBody only mounts once it's available — its useState calls read
// initialTask directly at mount time, rather than a parent syncing loaded
// data into already-mounted state via an effect.
export default function TaskFormScreen() {
  const params = useLocalSearchParams<{ id?: string; dueDate?: string }>();
  const editingId = params.id;
  const isEditing = !!editingId;
  const existingTask = useTask(editingId);

  if (isEditing && !existingTask) {
    return <View style={styles.container} />;
  }

  return (
    <TaskFormBody
      key={editingId ?? 'new'}
      editingId={editingId}
      initialTask={existingTask}
      defaultDueDate={params.dueDate}
    />
  );
}

interface BodyProps {
  editingId: string | undefined;
  initialTask: TaskWithCategory | null;
  defaultDueDate: string | undefined;
}

function TaskFormBody({ editingId, initialTask, defaultDueDate }: BodyProps) {
  const router = useRouter();
  const isEditing = !!editingId;

  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? defaultDueDate ?? todayString());
  const [dueTime, setDueTime] = useState<string | null>(initialTask?.dueTime ?? null);
  const [description, setDescription] = useState(initialTask?.description ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(initialTask?.categoryId ?? null);
  const [icon, setIcon] = useState<string | null>(initialTask?.icon ?? null);
  const [iconPickerVisible, setIconPickerVisible] = useState(false);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number | null>(
    initialTask?.reminderMinutesBefore ?? null,
  );
  const [reminderPermissionDenied, setReminderPermissionDenied] = useState(false);

  const canSave = title.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    const input = {
      title: title.trim(),
      dueDate,
      dueTime,
      description: description.trim() || null,
      categoryId,
      icon,
      reminderMinutesBefore,
    };
    if (isEditing && editingId) {
      await updateTask(editingId, input);
    } else {
      await createTask(input);
    }
    router.back();
  }

  async function handleDelete() {
    if (editingId) {
      await deleteTask(editingId);
      router.back();
    }
  }

  // Requesting notification permission at launch is the fastest way to get
  // permanently denied — Android 13+'s prompt should appear once, tied to the
  // exact moment the user actually wants a reminder. A denial always reverts
  // to None rather than leaving a stored offset that can never fire.
  async function handleReminderPress() {
    const next = cycleReminderOption(reminderMinutesBefore);
    if (next === null) {
      setReminderPermissionDenied(false);
      setReminderMinutesBefore(null);
      return;
    }
    const granted = await ensureNotificationPermission();
    if (!granted) {
      setReminderPermissionDenied(true);
      setReminderMinutesBefore(null);
      return;
    }
    setReminderPermissionDenied(false);
    setReminderMinutesBefore(next);
  }

  function openDatePicker() {
    DateTimePickerAndroid.open({
      value: parseDateString(dueDate),
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          setDueDate(toDateString(date));
        }
      },
    });
  }

  function openTimePicker() {
    let initial = new Date();
    if (dueTime) {
      const [h, m] = dueTime.split(':').map(Number);
      initial = new Date();
      initial.setHours(h, m, 0, 0);
    }

    DateTimePickerAndroid.open({
      value: initial,
      mode: 'time',
      onChange: (event, date) => {
        if (event.type === 'set' && date) {
          const hh = String(date.getHours()).padStart(2, '0');
          const mm = String(date.getMinutes()).padStart(2, '0');
          setDueTime(`${hh}:${mm}`);
        }
      },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={22} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit task' : 'New task'}</Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={8} accessibilityLabel="Save task">
          <Check size={22} color={canSave ? colors.accentPrimary : colors.textMuted} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor={colors.textMuted}
          style={styles.titleInput}
          autoFocus={!isEditing}
        />

        <View style={styles.fieldRow}>
          <Pressable onPress={openDatePicker} style={styles.fieldButton}>
            <Calendar size={16} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.fieldButtonLabel}>{formatDateLabel(dueDate)}</Text>
          </Pressable>
          <Pressable onPress={openTimePicker} style={styles.fieldButton}>
            <Clock size={16} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.fieldButtonLabel}>{dueTime ? formatTime12h(dueTime) : 'No time'}</Text>
          </Pressable>
          {dueTime && (
            <Pressable onPress={() => setDueTime(null)} hitSlop={8} style={styles.clearTime}>
              <X size={16} color={colors.textMuted} strokeWidth={1.75} />
            </Pressable>
          )}
        </View>

        <View>
          <Text style={styles.label}>Reminder</Text>
          <Pressable onPress={handleReminderPress} style={styles.fieldButton}>
            <Bell size={16} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.fieldButtonLabel}>{reminderLabel(reminderMinutesBefore)}</Text>
          </Pressable>
          {reminderPermissionDenied && (
            <Text style={styles.reminderWarning}>Reminders need notification permission.</Text>
          )}
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor={colors.textMuted}
          style={styles.descriptionInput}
          multiline
        />

        <CategoryPicker selectedCategoryId={categoryId} onSelect={setCategoryId} />

        <View>
          <Text style={styles.label}>Icon</Text>
          <Pressable onPress={() => setIconPickerVisible(true)} style={styles.iconButton}>
            {icon ? (
              <DynamicIcon name={icon} size={22} color={colors.textPrimary} strokeWidth={1.75} />
            ) : (
              <Text style={styles.iconButtonPlaceholder}>None</Text>
            )}
          </Pressable>
        </View>

        {isEditing && (
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 size={16} color={colors.danger} strokeWidth={1.75} />
            <Text style={styles.deleteLabel}>Delete task</Text>
          </Pressable>
        )}
      </ScrollView>

      <IconPicker
        visible={iconPickerVisible}
        selected={icon}
        onSelect={(next) => {
          setIcon(next);
          setIconPickerVisible(false);
        }}
        onClose={() => setIconPickerVisible(false)}
      />
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
  form: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  titleInput: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.heading,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldButtonLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.caption,
    color: colors.textPrimary,
  },
  clearTime: {
    padding: spacing.xs,
  },
  reminderWarning: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  descriptionInput: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    padding: spacing.md,
    alignSelf: 'flex-start',
  },
  iconButtonPlaceholder: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  deleteLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.danger,
  },
});
