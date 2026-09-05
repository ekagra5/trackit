import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { ReminderConfig, Task } from "@/types/habit";
import { formatReminderDays, requestNotificationPermission } from "@/lib/notifications";

const TASK_COLORS = [
  "#22C55E", "#3B82F6", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6",
];

const TASK_ICONS = [
  { id: "default", label: "Check" },
  { id: "exercise", label: "Activity" },
  { id: "meditation", label: "Wind" },
  { id: "reading", label: "Book" },
  { id: "water", label: "Water" },
  { id: "sleep", label: "Moon" },
  { id: "journal", label: "Journal" },
  { id: "nutrition", label: "Coffee" },
  { id: "coding", label: "Code" },
  { id: "walk", label: "Walk" },
  { id: "stretch", label: "Energy" },
  { id: "gratitude", label: "Heart" },
];

const ICON_MAP: Record<string, string> = {
  default: "check-circle",
  exercise: "activity",
  meditation: "wind",
  reading: "book-open",
  water: "droplet",
  sleep: "moon",
  journal: "edit-3",
  nutrition: "coffee",
  coding: "code",
  walk: "navigation",
  stretch: "zap",
  gratitude: "heart",
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

interface TaskFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "order">) => void;
  onDelete?: () => void;
  initialTask?: Task;
  defaultColor?: string;
}

export function TaskFormSheet({
  visible,
  onClose,
  onSave,
  onDelete,
  initialTask,
  defaultColor = "#22C55E",
}: TaskFormSheetProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [score, setScore] = useState(10);
  const [scoreText, setScoreText] = useState("10");
  const [color, setColor] = useState(defaultColor);
  const [icon, setIcon] = useState("default");
  const [locked, setLocked] = useState(false);
  const [reminder, setReminder] = useState<ReminderConfig>({
    enabled: false,
    time: "08:00",
    repeatDays: [1, 2, 3, 4, 5],
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState("08");
  const [tempMinute, setTempMinute] = useState("00");

  const isLocked = !!initialTask?.locked && !!initialTask;

  useEffect(() => {
    if (visible) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description ?? "");
        setScore(initialTask.score);
        setScoreText(String(initialTask.score));
        setColor(initialTask.color);
        setIcon(initialTask.icon);
        setLocked(!!initialTask.locked);
        setReminder(initialTask.reminder);
        const [h, m] = initialTask.reminder.time.split(":");
        setTempHour(h);
        setTempMinute(m);
      } else {
        setTitle("");
        setDescription("");
        setScore(10);
        setScoreText("10");
        setColor(defaultColor);
        setIcon("default");
        setLocked(false);
        setReminder({ enabled: false, time: "08:00", repeatDays: [1, 2, 3, 4, 5] });
        setTempHour("08");
        setTempMinute("00");
      }
    }
  }, [visible, initialTask, defaultColor]);

  const handleScoreTextChange = useCallback((text: string) => {
    setScoreText(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) setScore(num);
  }, []);

  const adjustScore = useCallback((delta: number) => {
    setScore((prev) => {
      const next = Math.max(1, prev + delta);
      setScoreText(String(next));
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task title.");
      return;
    }
    const finalScore = Math.max(1, parseInt(scoreText, 10) || score);
    if (reminder.enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert("Permission Required", "Enable notifications in Settings to use reminders.", [{ text: "OK" }]);
      }
    }
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      score: finalScore,
      color,
      icon,
      reminder,
      archived: false,
      locked,
    });
    onClose();
  }, [title, description, scoreText, score, color, icon, reminder, locked, onSave, onClose]);

  const toggleDay = useCallback((day: number) => {
    setReminder((r) => {
      const days = r.repeatDays.includes(day)
        ? r.repeatDays.filter((d) => d !== day)
        : [...r.repeatDays, day];
      return { ...r, repeatDays: days };
    });
  }, []);

  const confirmTime = useCallback(() => {
    setReminder((r) => ({ ...r, time: `${tempHour}:${tempMinute}` }));
    setShowTimePicker(false);
  }, [tempHour, tempMinute]);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Task", "This will delete the task and all its history. Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  }, [onDelete]);

  const handleLockToggle = useCallback((val: boolean) => {
    if (val) {
      Alert.alert(
        "Lock This Task?",
        "Locking prevents accidental edits and keeps this habit fixed. You can unlock it anytime from settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Lock It", onPress: () => setLocked(true) },
        ]
      );
    } else {
      setLocked(false);
    }
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View
          style={[
            styles.header,
            {
              borderBottomColor: c.border,
              paddingTop:
                Platform.OS === "web"
                  ? 20 + insets.top
                  : Platform.OS === "android"
                  ? 16 + Math.max(insets.top, StatusBar.currentHeight ?? 0, 32)
                  : 16 + insets.top,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: c.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>
            {initialTask ? (isLocked ? "🔒 Locked Task" : "Edit Task") : "New Task"}
          </Text>
          {!isLocked ? (
            <TouchableOpacity onPress={handleSave} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, { color: c.primary, fontWeight: "700" }]}>Save</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        {isLocked && (
          <View style={[styles.lockedBanner, { backgroundColor: c.streakLight, borderColor: c.streak + "44" }]}>
            <Feather name="lock" size={14} color={c.streak} />
            <Text style={[styles.lockedBannerText, { color: c.streak }]}>
              This task is locked. Unlock it below to make changes.
            </Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>TASK NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, color: c.foreground, borderColor: c.border }, isLocked && styles.inputDisabled]}
              placeholder="e.g. Morning Meditation"
              placeholderTextColor={c.mutedForeground}
              value={title}
              onChangeText={setTitle}
              returnKeyType="done"
              maxLength={60}
              editable={!isLocked}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: c.card, color: c.foreground, borderColor: c.border }, isLocked && styles.inputDisabled]}
              placeholder="Add notes about this habit..."
              placeholderTextColor={c.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
              editable={!isLocked}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>SCORE (POINTS)</Text>
            <View style={styles.scoreInputRow}>
              <TouchableOpacity
                style={[styles.scoreStepBtn, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={() => !isLocked && adjustScore(-5)}
                disabled={isLocked}
              >
                <Feather name="minus" size={18} color={isLocked ? c.mutedForeground : c.foreground} />
              </TouchableOpacity>
              <TextInput
                style={[styles.scoreInput, { backgroundColor: c.card, color: c.foreground, borderColor: c.primary }]}
                value={scoreText}
                onChangeText={handleScoreTextChange}
                keyboardType="number-pad"
                maxLength={4}
                editable={!isLocked}
                textAlign="center"
              />
              <TouchableOpacity
                style={[styles.scoreStepBtn, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={() => !isLocked && adjustScore(5)}
                disabled={isLocked}
              >
                <Feather name="plus" size={18} color={isLocked ? c.mutedForeground : c.foreground} />
              </TouchableOpacity>
              <View style={styles.scoreQuickRow}>
                {[5, 10, 20, 50, 100].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.scoreQuickChip, { borderColor: c.border, backgroundColor: c.card }, score === val && { backgroundColor: c.primary, borderColor: c.primary }]}
                    onPress={() => {
                      if (!isLocked) { setScore(val); setScoreText(String(val)); }
                    }}
                    disabled={isLocked}
                  >
                    <Text style={[styles.scoreQuickText, { color: score === val ? c.primaryForeground : c.foreground }]}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={[styles.scoreHint, { color: c.mutedForeground }]}>Enter any value — no limit. Higher = more important habit.</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>COLOR</Text>
            <View style={styles.colorRow}>
              {TASK_COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[styles.colorSwatch, { backgroundColor: col }, color === col && styles.colorSwatchSelected]}
                  onPress={() => !isLocked && setColor(col)}
                  disabled={isLocked}
                >
                  {color === col && <Feather name="check" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: c.mutedForeground }]}>ICON</Text>
            <View style={styles.iconRow}>
              {TASK_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic.id}
                  style={[
                    styles.iconOption,
                    { backgroundColor: c.card, borderColor: c.border },
                    icon === ic.id && { backgroundColor: color + "22", borderColor: color },
                  ]}
                  onPress={() => !isLocked && setIcon(ic.id)}
                  disabled={isLocked}
                >
                  <Feather
                    name={ICON_MAP[ic.id] as any}
                    size={20}
                    color={icon === ic.id ? color : c.mutedForeground}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.lockSection, { backgroundColor: c.card, borderColor: locked ? c.streak : c.border }]}>
            <View style={styles.lockRow}>
              <View style={[styles.lockIconBg, { backgroundColor: locked ? c.streakLight : c.accent }]}>
                <Feather name="lock" size={16} color={locked ? c.streak : c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lockTitle, { color: c.foreground }]}>Lock This Task</Text>
                <Text style={[styles.lockDesc, { color: c.mutedForeground }]}>
                  {locked
                    ? "Locked — prevents accidental edits and keeps this habit fixed."
                    : "Prevent editing to avoid changing this habit in the future."}
                </Text>
              </View>
              <Switch
                value={locked}
                onValueChange={handleLockToggle}
                trackColor={{ false: c.border, true: c.streak + "88" }}
                thumbColor={locked ? c.streak : c.mutedForeground}
              />
            </View>
          </View>

          <View style={[styles.section, styles.reminderSection, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderHeaderLeft}>
                <View style={[styles.bellIcon, { backgroundColor: c.accent }]}>
                  <Feather name="bell" size={16} color={c.primary} />
                </View>
                <View>
                  <Text style={[styles.reminderTitle, { color: c.foreground }]}>Reminders</Text>
                  <Text style={[styles.reminderSubtitle, { color: c.mutedForeground }]}>
                    {reminder.enabled
                      ? `${reminder.time} · ${formatReminderDays(reminder.repeatDays)}`
                      : "Off"}
                  </Text>
                </View>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={(val) => {
                  if (!isLocked) setReminder((r) => ({ ...r, enabled: val }));
                }}
                trackColor={{ false: c.border, true: c.primary + "88" }}
                thumbColor={reminder.enabled ? c.primary : c.mutedForeground}
                disabled={isLocked}
              />
            </View>

            {reminder.enabled && (
              <>
                <View style={[styles.divider, { backgroundColor: c.border }]} />
                <TouchableOpacity
                  style={styles.timeRow}
                  onPress={() => !isLocked && setShowTimePicker(true)}
                  disabled={isLocked}
                >
                  <Text style={[styles.timeLabel, { color: c.mutedForeground }]}>Time</Text>
                  <Text style={[styles.timeValue, { color: c.primary }]}>{reminder.time}</Text>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: c.border }]} />
                <Text style={[styles.daysLabel, { color: c.mutedForeground }]}>Repeat on</Text>
                <View style={styles.daysRow}>
                  {DAY_LABELS.map((lbl, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayBtn,
                        { borderColor: c.border, backgroundColor: c.background },
                        reminder.repeatDays.includes(idx) && { backgroundColor: c.primary, borderColor: c.primary },
                      ]}
                      onPress={() => !isLocked && toggleDay(idx)}
                      disabled={isLocked}
                    >
                      <Text style={[styles.dayBtnText, { color: reminder.repeatDays.includes(idx) ? c.primaryForeground : c.mutedForeground }]}>
                        {lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>

          {onDelete && (
            <TouchableOpacity style={[styles.deleteBtn, { borderColor: c.destructive + "44" }]} onPress={handleDelete}>
              <Feather name="trash-2" size={16} color={c.destructive} />
              <Text style={[styles.deleteBtnText, { color: c.destructive }]}>Delete Task</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={showTimePicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.timePickerOverlay}>
          <View style={[styles.timePickerCard, { backgroundColor: c.card, shadowColor: c.shadow }]}>
            <Text style={[styles.timePickerTitle, { color: c.foreground }]}>Select Time</Text>
            <View style={styles.timePickerRow}>
              <View style={styles.timePickerCol}>
                <Text style={[styles.timePickerColLabel, { color: c.mutedForeground }]}>Hour</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.timePickerOption, tempHour === h && { backgroundColor: c.primary + "22" }]}
                      onPress={() => setTempHour(h)}
                    >
                      <Text style={[styles.timePickerOptionText, { color: tempHour === h ? c.primary : c.foreground }]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <Text style={[styles.timeSeparator, { color: c.foreground }]}>:</Text>
              <View style={styles.timePickerCol}>
                <Text style={[styles.timePickerColLabel, { color: c.mutedForeground }]}>Minute</Text>
                <ScrollView style={styles.timePickerScroll} showsVerticalScrollIndicator={false}>
                  {MINUTES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.timePickerOption, tempMinute === m && { backgroundColor: c.primary + "22" }]}
                      onPress={() => setTempMinute(m)}
                    >
                      <Text style={[styles.timePickerOptionText, { color: tempMinute === m ? c.primary : c.foreground }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: c.primary }]} onPress={confirmTime}>
              <Text style={[styles.confirmBtnText, { color: c.primaryForeground }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 4, minWidth: 60 },
  headerBtnText: { fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  lockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  lockedBannerText: { fontSize: 13, fontWeight: "500", flex: 1 },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 10 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textArea: { minHeight: 80, textAlignVertical: "top", paddingTop: 12 },
  inputDisabled: { opacity: 0.5 },
  scoreInputRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  scoreStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreInput: {
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 22,
    fontWeight: "700",
    width: 80,
    textAlign: "center",
  },
  scoreQuickRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  scoreQuickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  scoreQuickText: { fontSize: 13, fontWeight: "600" },
  scoreHint: { fontSize: 11, marginTop: 8 },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  iconOption: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  lockSection: {
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 24,
    overflow: "hidden",
  },
  lockRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  lockIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  lockTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  lockDesc: { fontSize: 12, lineHeight: 16 },
  reminderSection: { borderRadius: 14, borderWidth: 1, overflow: "hidden", padding: 0, marginBottom: 24 },
  reminderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  reminderHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  bellIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  reminderTitle: { fontSize: 15, fontWeight: "600" },
  reminderSubtitle: { fontSize: 12, marginTop: 2 },
  divider: { height: 1 },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  timeLabel: { fontSize: 15 },
  timeValue: { fontSize: 15, fontWeight: "600" },
  daysLabel: { fontSize: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  daysRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  dayBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dayBtnText: { fontSize: 13, fontWeight: "600" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 8 },
  deleteBtnText: { fontSize: 15, fontWeight: "600" },
  timePickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  timePickerCard: { width: 280, borderRadius: 20, padding: 20, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 12 },
  timePickerTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  timePickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  timePickerCol: { alignItems: "center" },
  timePickerColLabel: { fontSize: 11, marginBottom: 8 },
  timePickerScroll: { height: 180 },
  timePickerOption: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, minWidth: 60, alignItems: "center" },
  timePickerOptionText: { fontSize: 18, fontWeight: "600" },
  timeSeparator: { fontSize: 24, fontWeight: "700", marginTop: 28 },
  confirmBtn: { borderRadius: 12, padding: 14, alignItems: "center", marginTop: 16 },
  confirmBtnText: { fontSize: 15, fontWeight: "700" },
});
