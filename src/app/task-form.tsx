import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { type NavigationAction, usePreventRemove } from 'expo-router/react-navigation';
import { Bell, Calendar, Clock, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryPicker } from '@/components/CategoryPicker';
import { DataText } from '@/components/DataText';
import { DiscardChangesPrompt } from '@/components/DiscardChangesPrompt';
import { DynamicIcon } from '@/components/DynamicIcon';
import { FilterPill } from '@/components/FilterPill';
import { IconButton } from '@/components/IconButton';
import { IconPicker } from '@/components/IconPicker';
import { createTask, deleteTask, updateTask } from '@/db/mutations';
import { useTask } from '@/hooks/useTasks';
import { formatDateLabel, formatTime12h, parseDateString, toDateString, todayString } from '@/lib/dates';
import { iconLabel } from '@/lib/icons';
import { ensureNotificationPermission } from '@/lib/notifications';
import { REMINDER_OPTIONS, UNTIMED_REMINDER_HOUR } from '@/lib/reminders';
import type { TaskWithCategory } from '@/lib/types';
import { startUndoWindow } from '@/store/undo';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';
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
  const liveTask = useTask(editingId);

  // useTask reports null both before the first load and after the row is
  // deleted. A delete from this very form lands mid-handleDelete, and falling
  // back to the blank loading view then would unmount TaskFormBody — taking
  // its `closing` effect, the only thing that calls router.back(), with it —
  // and strand the user on an empty screen. So once the task has loaded, keep
  // rendering its last copy until the screen closes. The id check stops a
  // reused route instance from showing the previous task's data for a new id.
  // (Set during render, not in an effect — liveTask is memoized per query
  // result in useJoinedTasks, so the identity check settles after one pass.)
  const [lastTask, setLastTask] = useState<TaskWithCategory | null>(null);
  if (liveTask && liveTask !== lastTask) setLastTask(liveTask);
  const existingTask = liveTask ?? (lastTask?.id === editingId ? lastTask : null);

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
  const navigation = useNavigation();
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

  // Set once a save or delete has landed, so the screen can close without
  // tripping the unsaved-changes guard below.
  const [closing, setClosing] = useState(false);
  // Guards against a double-tap on Save creating the task twice — the write
  // is async and the screen stays mounted until it lands.
  const [saving, setSaving] = useState(false);
  const [pendingExit, setPendingExit] = useState<NavigationAction | null>(null);

  const isDirty =
    title !== (initialTask?.title ?? '') ||
    dueDate !== (initialTask?.dueDate ?? defaultDueDate ?? todayString()) ||
    dueTime !== (initialTask?.dueTime ?? null) ||
    description !== (initialTask?.description ?? '') ||
    categoryId !== (initialTask?.categoryId ?? null) ||
    icon !== (initialTask?.icon ?? null) ||
    reminderMinutesBefore !== (initialTask?.reminderMinutesBefore ?? null);

  // Catches every way out — the X button and hardware/gesture Back alike —
  // so unsaved edits are never thrown away without asking.
  usePreventRemove(isDirty && !closing, ({ data }) => setPendingExit(data.action));

  useEffect(() => {
    if (closing) router.back();
  }, [closing, router]);

  const canSave = title.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const input = {
      title: title.trim(),
      dueDate,
      dueTime,
      description: description.trim() || null,
      categoryId,
      icon,
      reminderMinutesBefore,
    };
    try {
      if (isEditing && editingId) {
        await updateTask(editingId, input);
      } else {
        await createTask(input);
      }
    } catch (error) {
      setSaving(false);
      throw error;
    }
    setClosing(true);
  }

  // Same delete-with-undo as a swipe or the long-press menu: the Undo toast
  // shows on whichever list this form returns to (src/store/undo.ts).
  async function handleDelete() {
    if (!editingId || !initialTask) return;
    await deleteTask(editingId);
    startUndoWindow({ kind: 'delete', task: initialTask });
    setClosing(true);
  }

  function discardChanges() {
    const action = pendingExit;
    setPendingExit(null);
    if (action) navigation.dispatch(action);
  }

  // Requesting notification permission at launch is the fastest way to get
  // permanently denied — Android 13+'s prompt should appear once, tied to the
  // exact moment the user actually wants a reminder. A denial always reverts
  // to None rather than leaving a stored offset that can never fire.
  async function handleReminderSelect(next: number | null) {
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
        <IconButton icon={X} label="Close" onPress={() => router.back()} />
        <Text style={styles.headerTitle} accessibilityRole="header">
          {isEditing ? 'Edit task' : 'New task'}
        </Text>
        {/* Keeps the title centered now that Save lives at the bottom. */}
        <View style={styles.headerSpacer} />
      </View>

      {/* The Save button sits above the keyboard, in the thumb zone, instead
          of in the top-right corner — the one-handed reach PRODUCT.md asks
          for, and the bottom-anchored primary action DESIGN.md §6 specifies. */}
      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior="padding">
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Task title"
          placeholderTextColor={colors.textMuted}
          style={styles.titleInput}
          autoFocus={!isEditing}
          accessibilityLabel="Task title"
          // Enter on the keyboard saves — type a title, tap once, done.
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={handleSave}
        />

        <View style={styles.fieldRow}>
          <Pressable
            onPress={openDatePicker}
            style={styles.fieldButton}
            accessibilityRole="button"
            accessibilityLabel={`Due date, ${formatDateLabel(dueDate)}`}>
            <Calendar size={16} color={colors.textSecondary} strokeWidth={1.75} />
            <DataText style={styles.fieldButtonLabel}>{formatDateLabel(dueDate)}</DataText>
          </Pressable>
          <Pressable
            onPress={openTimePicker}
            style={styles.fieldButton}
            accessibilityRole="button"
            accessibilityLabel={`Due time, ${dueTime ? formatTime12h(dueTime) : 'none'}`}>
            <Clock size={16} color={colors.textSecondary} strokeWidth={1.75} />
            <DataText style={styles.fieldButtonLabel}>{dueTime ? formatTime12h(dueTime) : 'No time'}</DataText>
          </Pressable>
          {dueTime && (
            <IconButton icon={X} label="Clear due time" onPress={() => setDueTime(null)} size={18} />
          )}
        </View>

        <View>
          <View style={styles.labelRow}>
            <Bell size={14} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={[styles.label, styles.labelInRow]}>Reminder</Text>
          </View>
          {/* Every option visible at once — the old single field cycled
              through five hidden values one tap at a time. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled">
            {REMINDER_OPTIONS.map((option) => (
              <FilterPill
                key={option.label}
                label={option.label}
                selected={reminderMinutesBefore === option.minutesBefore}
                onPress={() => handleReminderSelect(option.minutesBefore)}
              />
            ))}
          </ScrollView>
          {reminderPermissionDenied ? (
            <Text style={styles.reminderWarning} accessibilityLiveRegion="polite">
              Reminders need notification permission. Allow it in system settings, then pick again.
            </Text>
          ) : (
            reminderMinutesBefore !== null &&
            !dueTime && (
              <Text style={styles.reminderHint}>
                No due time set, so this counts from {UNTIMED_REMINDER_HOUR}:00 AM on the due date.
              </Text>
            )
          )}
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Description"
          style={styles.descriptionInput}
          multiline
        />

        <CategoryPicker selectedCategoryId={categoryId} onSelect={setCategoryId} />

        <View>
          <Text style={styles.label}>Icon</Text>
          <Pressable
            onPress={() => setIconPickerVisible(true)}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={`Task icon, ${icon ? iconLabel(icon) : 'none'}`}>
            {icon ? (
              <DynamicIcon name={icon} size={22} color={colors.textPrimary} strokeWidth={1.75} />
            ) : (
              <Text style={styles.iconButtonPlaceholder}>None</Text>
            )}
          </Pressable>
        </View>

        {isEditing && (
          <Pressable onPress={handleDelete} style={styles.deleteButton} accessibilityRole="button">
            <Trash2 size={16} color={colors.danger} strokeWidth={1.75} />
            <Text style={styles.deleteLabel}>Delete task</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel="Save task"
          accessibilityHint={canSave ? undefined : 'Add a title first'}
          accessibilityState={{ disabled: !canSave }}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}>
          <Text style={styles.saveLabel}>Save task</Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>

      <DiscardChangesPrompt
        visible={!!pendingExit}
        onKeepEditing={() => setPendingExit(null)}
        onDiscard={discardChanges}
      />

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
  keyboardAvoider: {
    flex: 1,
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
    borderBottomColor: colors.borderStrong,
    minHeight: minTouchTarget,
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
    minHeight: minTouchTarget,
  },
  fieldButtonLabel: {
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  labelInRow: {
    marginBottom: 0,
  },
  chipRow: {
    gap: spacing.sm,
    // Android drops touches outside a ScrollView's bounds, so the chips'
    // 6dp vertical hitSlop needs real padding to land in.
    paddingVertical: spacing.sm,
  },
  reminderWarning: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  reminderHint: {
    fontFamily: fonts.body,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
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
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.card,
    padding: spacing.md,
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
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
    minHeight: minTouchTarget,
    marginTop: spacing.md,
  },
  deleteLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bgBase,
  },
  saveButton: {
    minHeight: minTouchTarget + spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentPrimary,
    borderRadius: radius.pill,
  },
  // Dimmed until there's a title; the title field above already says what's
  // missing, and TalkBack gets the reason as the button's hint.
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.body,
    color: colors.bgBase,
  },
});
