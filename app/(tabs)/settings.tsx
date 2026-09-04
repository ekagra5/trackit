import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHabit } from "@/context/HabitContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import {
  getShowFailButton, setShowFailButton,
  getAutoSortTasks, setAutoSortTasks,
  getShowDailyQuote, setShowDailyQuote,
} from "@/lib/appSettings";
import { requestNotificationPermission, rescheduleAllReminders } from "@/lib/notifications";
import { clearAll } from "@/lib/storage";
import { GlassBackground } from "@/components/GlassBackground";
import { GlassCard } from "@/components/GlassCard";

export default function SettingsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useHabit();
  const { isDark, setDark } = useTheme();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showFailBtn, setShowFailBtn] = useState(false);
  const [autoSort, setAutoSort] = useState(true);
  const [showQuote, setShowQuote] = useState(true);

  useEffect(() => {
    Promise.all([
      getShowFailButton().then(setShowFailBtn),
      getAutoSortTasks().then(setAutoSort),
      getShowDailyQuote().then(setShowQuote),
    ]);
  }, []);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotifEnabled(true);
        await rescheduleAllReminders(state.tasks);
      } else {
        Alert.alert("Permission Denied", "Enable notifications in your device Settings.");
      }
    } else {
      setNotifEnabled(false);
    }
  }, [state.tasks]);

  const handleToggleFailButton = useCallback(async (value: boolean) => {
    setShowFailBtn(value);
    await setShowFailButton(value);
  }, []);

  const handleToggleAutoSort = useCallback(async (value: boolean) => {
    setAutoSort(value);
    await setAutoSortTasks(value);
  }, []);

  const handleToggleQuote = useCallback(async (value: boolean) => {
    setShowQuote(value);
    await setShowDailyQuote(value);
  }, []);

  const handleClearData = useCallback(() => {
    Alert.alert(
      "Clear All Data",
      "This permanently deletes all your tasks and history. Cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await clearAll();
            Alert.alert("Done", "All data cleared. Restart the app.");
          },
        },
      ]
    );
  }, []);

  function SettingRow({
    icon,
    label,
    sublabel,
    value,
    onPress,
    rightElement,
    danger,
  }: {
    icon: string;
    label: string;
    sublabel?: string;
    value?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    danger?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: c.border }]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress && !rightElement}
      >
        <View style={[styles.settingIcon, { backgroundColor: danger ? c.failLight : c.accent }]}>
          <Feather name={icon as any} size={16} color={danger ? c.fail : c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingLabel, { color: danger ? c.fail : c.foreground }]}>{label}</Text>
          {sublabel ? <Text style={[styles.settingSublabel, { color: c.mutedForeground }]}>{sublabel}</Text> : null}
        </View>
        {value ? <Text style={[styles.settingValue, { color: c.mutedForeground }]}>{value}</Text> : null}
        {rightElement ?? null}
        {onPress && !rightElement ? (
          <Feather name="chevron-right" size={18} color={c.mutedForeground} />
        ) : null}
      </TouchableOpacity>
    );
  }

  function SectionHeader({ label }: { label: string }) {
    return <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>{label}</Text>;
  }

  const sw = (val: boolean, fn: (v: boolean) => void) => (
    <Switch
      value={val}
      onValueChange={fn}
      trackColor={{ false: c.border, true: c.primary + "88" }}
      thumbColor={val ? c.primary : c.mutedForeground}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <GlassBackground>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: topInset + 16, paddingBottom: bottomInset + 110 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: c.foreground }]}>Settings</Text>

          <View style={styles.statsOverview}>
            <GlassCard style={styles.statsCard} padding={14}>
              <Text style={[styles.statsValue, { color: c.foreground }]}>
                {state.tasks.filter((t) => !t.archived).length}
              </Text>
              <Text style={[styles.statsLabel, { color: c.mutedForeground }]}>Active tasks</Text>
            </GlassCard>
            <GlassCard style={styles.statsCard} padding={14}>
              <Text style={[styles.statsValue, { color: c.foreground }]}>{state.logs.length}</Text>
              <Text style={[styles.statsLabel, { color: c.mutedForeground }]}>Days logged</Text>
            </GlassCard>
            <GlassCard style={styles.statsCard} padding={14}>
              <Text style={[styles.statsValue, { color: c.streak }]}>{state.currentStreak}</Text>
              <Text style={[styles.statsLabel, { color: c.mutedForeground }]}>Streak</Text>
            </GlassCard>
          </View>

          <SectionHeader label="APPEARANCE" />
          <GlassCard style={styles.settingGroup} padding={0}>
            <SettingRow
              icon={isDark ? "moon" : "sun"}
              label="Dark Mode"
              sublabel={isDark ? "Currently dark — glassmorphism dark" : "Currently light — glassmorphism light"}
              rightElement={sw(isDark, setDark)}
            />
          </GlassCard>

          <SectionHeader label="TODAY SCREEN" />
          <GlassCard style={styles.settingGroup} padding={0}>
            <SettingRow
              icon="sun"
              label="Daily Motivational Quote"
              sublabel="Show a new quote each day"
              rightElement={sw(showQuote, handleToggleQuote)}
            />
            <SettingRow
              icon="layers"
              label="Auto-Sort: Done to Bottom"
              sublabel="Completed tasks move to the bottom"
              rightElement={sw(autoSort, handleToggleAutoSort)}
            />
          </GlassCard>

          <SectionHeader label="TASK ACTIONS" />
          <GlassCard style={styles.settingGroup} padding={0}>
            <SettingRow
              icon="x-circle"
              label="Show Fail Button on Tasks"
              sublabel="Adds a ✗ button to mark tasks failed"
              rightElement={sw(showFailBtn, handleToggleFailButton)}
            />
          </GlassCard>

          <SectionHeader label="NOTIFICATIONS" />
          <GlassCard style={styles.settingGroup} padding={0}>
            <SettingRow
              icon="bell"
              label="Enable Reminders"
              sublabel="Per-task reminders you configured"
              rightElement={sw(notifEnabled, handleToggleNotifications)}
            />
          </GlassCard>

          <SectionHeader label="LEGAL" />
          <GlassCard style={styles.settingGroup} padding={0}>
            <SettingRow
              icon="shield"
              label="Privacy Policy"
              onPress={() => router.push("/privacy")}
            />
            <SettingRow
              icon="file-text"
              label="Terms of Service"
              onPress={() =>
                Alert.alert(
                  "Terms of Service",
                  "TrackIt is free and open source software, provided as-is with no warranty. See the LICENSE file in the repository for full terms."
                )
              }
            />
          </GlassCard>

          <SectionHeader label="DATA" />
          <GlassCard style={styles.settingGroup} padding={0}>
            <SettingRow
              icon="trash-2"
              label="Clear All Data"
              onPress={handleClearData}
              danger
            />
          </GlassCard>

          <SectionHeader label="ABOUT" />
          <GlassCard style={styles.settingGroup} padding={0}>
            <SettingRow icon="info" label="Version" value="1.0.0" />
            <SettingRow
              icon="github"
              label="Source Code"
              sublabel="TrackIt is free and open source"
              onPress={() => Linking.openURL("https://github.com/ekagra5/trackit")}
            />
          </GlassCard>

          <View style={[styles.madeWithCard, { borderColor: c.glassBorder }]}>
            <Feather name="zap" size={14} color={c.primary} />
            <Text style={[styles.madeWithText, { color: c.mutedForeground }]}>
              TrackIt · Build habits that last.{"\n"}All data stored locally on your device.
            </Text>
          </View>
        </ScrollView>
      </GlassBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 20 },
  statsOverview: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statsCard: { flex: 1, alignItems: "center" },
  statsValue: { fontSize: 22, fontWeight: "700" },
  statsLabel: { fontSize: 11, marginTop: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  settingGroup: { overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 15, fontWeight: "500" },
  settingSublabel: { fontSize: 11, marginTop: 1 },
  settingValue: { fontSize: 14 },
  madeWithCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 28,
    marginBottom: 10,
  },
  madeWithText: { fontSize: 12, lineHeight: 18, textAlign: "center" },
});
