import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHabit } from "@/context/HabitContext";
import { useColors } from "@/hooks/useColors";
import { ProgressRing } from "@/components/ProgressRing";
import { EmptyState } from "@/components/EmptyState";
import { GlassBackground } from "@/components/GlassBackground";
import { GlassCard } from "@/components/GlassCard";
import { formatDisplayDate, isToday, isPast } from "@/lib/dateUtils";

export default function HistoryScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useHabit();
  const [expanded, setExpanded] = useState<string | null>(null);

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const sortedLogs = [...state.logs]
    .filter((l) => isPast(l.date) || isToday(l.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={styles.container}>
      <GlassBackground>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: topInset + 16, paddingBottom: bottomInset + 110 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: c.foreground }]}>History</Text>

          {sortedLogs.length === 0 ? (
            <GlassCard padding={40}>
              <EmptyState
                icon="calendar"
                title="No history yet"
                description="Complete habits today to build your log"
              />
            </GlassCard>
          ) : (
            sortedLogs.map((log) => {
              const isExpanded = expanded === log.date;
              const isLogToday = isToday(log.date);
              const completed = log.entries.filter((e) => e.status === "complete").length;
              const failed = log.entries.filter((e) => e.status === "failed").length;
              const pending = log.entries.filter((e) => e.status === "pending").length;

              return (
                <GlassCard key={log.date} style={styles.logCard} padding={0}>
                  <TouchableOpacity
                    style={styles.logHeader}
                    onPress={() => setExpanded(isExpanded ? null : log.date)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.logHeaderLeft}>
                      <ProgressRing
                        progress={log.completionRate}
                        size={52}
                        strokeWidth={5}
                        color={
                          log.completionRate >= 0.8
                            ? c.success
                            : log.completionRate >= 0.5
                            ? c.warning
                            : c.fail
                        }
                      />
                      <View style={styles.logMeta}>
                        <View style={styles.logDateRow}>
                          <Text style={[styles.logDate, { color: c.foreground }]}>
                            {isLogToday ? "Today" : formatDisplayDate(log.date)}
                          </Text>
                          {isLogToday && (
                            <View style={[styles.todayBadge, { backgroundColor: c.accent }]}>
                              <Text style={[styles.todayBadgeText, { color: c.primary }]}>Today</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.pillRow}>
                          {completed > 0 && (
                            <View style={[styles.pill, { backgroundColor: c.successLight }]}>
                              <Text style={[styles.pillText, { color: c.success }]}>{completed} ✓</Text>
                            </View>
                          )}
                          {failed > 0 && (
                            <View style={[styles.pill, { backgroundColor: c.failLight }]}>
                              <Text style={[styles.pillText, { color: c.fail }]}>{failed} ✗</Text>
                            </View>
                          )}
                          {pending > 0 && (
                            <View style={[styles.pill, { backgroundColor: c.neutralLight }]}>
                              <Text style={[styles.pillText, { color: c.neutral }]}>{pending} —</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.logHeaderRight}>
                      <View style={styles.scoreDisplay}>
                        <Text style={[styles.scoreValue, { color: c.foreground }]}>{log.totalScore}</Text>
                        <Text style={[styles.scoreMax, { color: c.mutedForeground }]}>/{log.maxScore}</Text>
                      </View>
                      <Feather
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={c.mutedForeground}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.entriesContainer, { borderTopColor: c.border }]}>
                      {log.entries.map((entry) => {
                        const statusColor =
                          entry.status === "complete"
                            ? c.success
                            : entry.status === "failed"
                            ? c.fail
                            : c.neutral;
                        const statusIcon =
                          entry.status === "complete" ? "check" : entry.status === "failed" ? "x" : "minus";

                        return (
                          <View
                            key={entry.taskId}
                            style={[styles.entryRow, { borderBottomColor: c.border }]}
                          >
                            <View
                              style={[
                                styles.entryStatusDot,
                                { backgroundColor: statusColor + "22", borderColor: statusColor + "44" },
                              ]}
                            >
                              <Feather name={statusIcon as any} size={12} color={statusColor} />
                            </View>
                            <Text style={[styles.entryTitle, { color: c.foreground }]}>
                              {entry.taskTitle}
                            </Text>
                            <Text style={[styles.entryScore, { color: c.mutedForeground }]}>
                              {entry.status === "complete" ? `+${entry.taskScore}` : "0"} pts
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </GlassCard>
              );
            })
          )}
        </ScrollView>
      </GlassBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 20 },
  logCard: { marginBottom: 10, overflow: "hidden" },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  logHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logMeta: { flex: 1 },
  logDateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  logDate: { fontSize: 15, fontWeight: "600" },
  todayBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  todayBadgeText: { fontSize: 10, fontWeight: "700" },
  pillRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  pillText: { fontSize: 11, fontWeight: "600" },
  logHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  scoreDisplay: { flexDirection: "row", alignItems: "baseline" },
  scoreValue: { fontSize: 18, fontWeight: "700" },
  scoreMax: { fontSize: 12 },
  entriesContainer: { borderTopWidth: 1 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  entryStatusDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  entryTitle: { flex: 1, fontSize: 14 },
  entryScore: { fontSize: 13, fontWeight: "600" },
});
