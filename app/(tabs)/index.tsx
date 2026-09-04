import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHabit } from "@/context/HabitContext";
import { useColors } from "@/hooks/useColors";
import { TaskCard } from "@/components/TaskCard";
import { ProgressRing } from "@/components/ProgressRing";
import { TaskFormSheet } from "@/components/TaskFormSheet";
import { EmptyState } from "@/components/EmptyState";
import { GlassBackground } from "@/components/GlassBackground";
import { GlassCard } from "@/components/GlassCard";
import { getShowFailButton, getAutoSortTasks, getShowDailyQuote } from "@/lib/appSettings";
import { getTodayQuote } from "@/lib/quotes";
import type { Task } from "@/types/habit";

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { state, addTask, updateTask, deleteTask, markTask, getTodayLog, getNextTaskColor } = useHabit();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [showFailButton, setShowFailButton] = useState(false);
  const [autoSort, setAutoSort] = useState(true);
  const [showQuote, setShowQuote] = useState(true);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const celebrationAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Promise.all([
      getShowFailButton().then(setShowFailButton),
      getAutoSortTasks().then(setAutoSort),
      getShowDailyQuote().then(setShowQuote),
    ]);
  }, []);

  const todayLog = getTodayLog();
  const activeTasks = state.tasks.filter((t) => !t.archived);

  const sortedTasks = React.useMemo(() => {
    if (!autoSort) return [...activeTasks].sort((a, b) => a.order - b.order);
    const statusOrder = { pending: 0, failed: 1, complete: 2, skipped: 3 };
    return [...activeTasks].sort((a, b) => {
      const aEntry = todayLog?.entries.find((e) => e.taskId === a.id);
      const bEntry = todayLog?.entries.find((e) => e.taskId === b.id);
      const aStatus = aEntry?.status ?? "pending";
      const bStatus = bEntry?.status ?? "pending";
      if (statusOrder[aStatus] !== statusOrder[bStatus]) {
        return statusOrder[aStatus] - statusOrder[bStatus];
      }
      return a.order - b.order;
    });
  }, [activeTasks, todayLog, autoSort]);

  const completedCount = todayLog?.entries.filter((e) => e.status === "complete").length ?? 0;
  const failedCount = todayLog?.entries.filter((e) => e.status === "failed").length ?? 0;
  const totalTasks = activeTasks.length;
  const progress = totalTasks > 0 ? completedCount / totalTasks : 0;
  const score = todayLog?.totalScore ?? 0;
  const maxScore = todayLog?.maxScore ?? 0;
  const allDone = totalTasks > 0 && completedCount === totalTasks;

  useEffect(() => {
    if (allDone) {
      setCelebrationVisible(true);
      celebrationAnim.setValue(0);
      Animated.spring(celebrationAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 120,
      }).start();
    } else {
      setCelebrationVisible(false);
    }
  }, [allDone]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const quote = getTodayQuote();

  const last7 = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const log = state.logs.find((l) => l.date === key);
      const isToday = i === 6;
      return { key, log, isToday, dayLabel: ["S", "M", "T", "W", "T", "F", "S"][d.getDay()] };
    });
  }, [state.logs]);

  const handleSaveTask = useCallback(
    (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "order">) => {
      if (editingTask) {
        updateTask({ ...editingTask, ...data });
      } else {
        addTask(data);
      }
      setEditingTask(undefined);
    },
    [editingTask, addTask, updateTask]
  );

  const handleComplete = useCallback(
    (taskId: string) => {
      const entry = todayLog?.entries.find((e) => e.taskId === taskId);
      markTask(taskId, entry?.status === "complete" ? "pending" : "complete");
    },
    [todayLog, markTask]
  );

  const handleFail = useCallback(
    (taskId: string) => {
      markTask(taskId, "failed");
    },
    [markTask]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  }, []);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={styles.container}>
      <GlassBackground>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: topInset + 16, paddingBottom: bottomInset + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
          }
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dateText, { color: c.mutedForeground }]}>{today}</Text>
              <Text style={[styles.greeting, { color: c.foreground }]}>Today's Habits</Text>
            </View>
            {state.currentStreak > 0 && (
              <GlassCard style={styles.streakBadge} padding={0}>
                <View style={[styles.streakInner, { backgroundColor: c.streakLight }]}>
                  <Feather name="zap" size={14} color={c.streak} />
                  <Text style={[styles.streakText, { color: c.streak }]}>{state.currentStreak}d</Text>
                </View>
              </GlassCard>
            )}
          </View>

          {showQuote && (
            <GlassCard style={styles.quoteCard} padding={14}>
              <View style={styles.quoteInner}>
                <Feather name="sun" size={14} color={c.streak} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quoteText, { color: c.foreground }]}>"{quote.text}"</Text>
                  <Text style={[styles.quoteAuthor, { color: c.mutedForeground }]}>— {quote.author}</Text>
                </View>
              </View>
            </GlassCard>
          )}

          <GlassCard style={styles.weekCard} padding={12}>
            <View style={styles.weekRow}>
              {last7.map(({ key, log, isToday, dayLabel }) => {
                const rate = log?.completionRate ?? -1;
                const dotColor =
                  rate < 0
                    ? c.neutralLight
                    : rate >= 0.8
                    ? c.success
                    : rate >= 0.5
                    ? c.warning
                    : c.fail;
                return (
                  <View key={key} style={styles.weekDayCol}>
                    <Text style={[styles.weekDayLabel, { color: c.mutedForeground }]}>{dayLabel}</Text>
                    <View
                      style={[
                        styles.weekDot,
                        { backgroundColor: rate < 0 ? c.muted : dotColor + "33", borderColor: isToday ? c.primary : "transparent", borderWidth: isToday ? 2 : 0 },
                      ]}
                    >
                      {rate >= 0 && <View style={[styles.weekDotFill, { backgroundColor: dotColor }]} />}
                    </View>
                    {isToday && <View style={[styles.weekTodayBar, { backgroundColor: c.primary }]} />}
                  </View>
                );
              })}
            </View>
            <Text style={[styles.weekCaption, { color: c.mutedForeground }]}>Last 7 days completion</Text>
          </GlassCard>

          {totalTasks > 0 && (
            <GlassCard style={styles.summaryCard} padding={18}>
              <View style={styles.summaryLeft}>
                <ProgressRing
                  progress={progress}
                  size={86}
                  strokeWidth={7}
                  label={`${Math.round(progress * 100)}%`}
                  sublabel="done"
                  color={c.primary}
                />
              </View>
              <View style={styles.summaryRight}>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryDot, { backgroundColor: c.success }]} />
                  <Text style={[styles.summaryItem, { color: c.foreground }]}>{completedCount} completed</Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryDot, { backgroundColor: c.fail }]} />
                  <Text style={[styles.summaryItem, { color: c.foreground }]}>{failedCount} failed</Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryDot, { backgroundColor: c.neutral }]} />
                  <Text style={[styles.summaryItem, { color: c.foreground }]}>
                    {totalTasks - completedCount - failedCount} remaining
                  </Text>
                </View>
                <View style={[styles.scoreLine, { borderTopColor: c.border }]}>
                  <Feather name="star" size={13} color={c.streak} />
                  <Text style={[styles.scoreLabel, { color: c.foreground }]}>{score} / {maxScore} pts</Text>
                </View>
              </View>
            </GlassCard>
          )}

          {celebrationVisible && allDone && (
            <Animated.View
              style={[
                styles.celebration,
                { backgroundColor: c.successLight, borderColor: c.success + "44" },
                {
                  opacity: celebrationAnim,
                  transform: [{ scale: celebrationAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                },
              ]}
            >
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <View>
                <Text style={[styles.celebrationTitle, { color: c.success }]}>All done for today!</Text>
                <Text style={[styles.celebrationSub, { color: c.accentForeground }]}>
                  Perfect score · {score} pts earned · Keep your streak going!
                </Text>
              </View>
            </Animated.View>
          )}

          <View style={styles.tasksSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Tasks ({totalTasks})</Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: c.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingTask(undefined);
                  setShowForm(true);
                }}
              >
                <Feather name="plus" size={18} color={c.primaryForeground} />
              </TouchableOpacity>
            </View>

            {sortedTasks.length === 0 ? (
              <GlassCard padding={32}>
                <EmptyState
                  icon="clipboard"
                  title="No tasks yet"
                  description="Add your first habit to start building a streak"
                  actionLabel="Add Task"
                  onAction={() => setShowForm(true)}
                />
              </GlassCard>
            ) : (
              sortedTasks.map((task) => {
                const entry = todayLog?.entries.find((e) => e.taskId === task.id);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    entry={entry}
                    onComplete={() => handleComplete(task.id)}
                    onFail={() => handleFail(task.id)}
                    onPress={() => {
                      setEditingTask(task);
                      setShowForm(true);
                    }}
                    onEdit={() => {
                      setEditingTask(task);
                      setShowForm(true);
                    }}
                    showFailButton={showFailButton}
                  />
                );
              })
            )}
          </View>
        </ScrollView>
      </GlassBackground>

      <TaskFormSheet
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTask(undefined);
        }}
        onSave={handleSaveTask}
        onDelete={
          editingTask
            ? () => {
                deleteTask(editingTask.id);
                setShowForm(false);
                setEditingTask(undefined);
              }
            : undefined
        }
        initialTask={editingTask}
        defaultColor={getNextTaskColor()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  dateText: { fontSize: 13, marginBottom: 2 },
  greeting: { fontSize: 26, fontWeight: "800" },
  streakBadge: { marginTop: 4 },
  streakInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
  },
  streakText: { fontSize: 14, fontWeight: "700" },
  quoteCard: { marginBottom: 12 },
  quoteInner: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  quoteText: { fontSize: 13, fontStyle: "italic", lineHeight: 19, marginBottom: 4 },
  quoteAuthor: { fontSize: 11, fontWeight: "600" },
  weekCard: { marginBottom: 12 },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  weekDayCol: { alignItems: "center", gap: 4, flex: 1 },
  weekDayLabel: { fontSize: 11, fontWeight: "600" },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDotFill: { width: 12, height: 12, borderRadius: 6 },
  weekTodayBar: { width: 4, height: 4, borderRadius: 2 },
  weekCaption: { fontSize: 10, textAlign: "center", marginTop: 2 },
  summaryCard: { marginBottom: 16, flexDirection: "row", alignItems: "center" },
  summaryLeft: { marginRight: 20 },
  summaryRight: { flex: 1 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryItem: { fontSize: 13 },
  scoreLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  scoreLabel: { fontSize: 14, fontWeight: "600" },
  celebration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  celebrationEmoji: { fontSize: 32 },
  celebrationTitle: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  celebrationSub: { fontSize: 12, lineHeight: 17 },
  tasksSection: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
