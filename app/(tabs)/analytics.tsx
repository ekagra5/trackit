import React, { useMemo, useState } from "react";
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
import { LineChart } from "@/components/LineChart";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { GlassBackground } from "@/components/GlassBackground";
import { GlassCard } from "@/components/GlassCard";
import { computeAnalytics } from "@/lib/analytics";

export default function AnalyticsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useHabit();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [metric, setMetric] = useState<"completionRate" | "totalScore">("completionRate");

  const analytics = useMemo(
    () => computeAnalytics(state.logs, state.tasks),
    [state.logs, state.tasks]
  );

  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;
  const hasData = state.logs.length > 0;

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
          <Text style={[styles.title, { color: c.foreground }]}>Analytics</Text>

          {!hasData ? (
            <GlassCard padding={40}>
              <EmptyState
                icon="bar-chart-2"
                title="No data yet"
                description="Complete some habits to see your analytics here"
              />
            </GlassCard>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <StatCard label="7-day rate" value={`${analytics.completionRate7Days}%`} icon="trending-up" color={c.primary} />
                <StatCard label="Streak" value={analytics.currentStreak} icon="zap" color={c.streak} subtitle={`Best: ${analytics.longestStreak}d`} />
              </View>
              <View style={styles.statsGrid}>
                <StatCard label="Completions" value={analytics.totalCompletions} icon="check-circle" color={c.success} />
                <StatCard label="Failures" value={analytics.totalFailures} icon="x-circle" color={c.fail} />
              </View>
              <View style={styles.statsGrid}>
                <StatCard label="Best score" value={analytics.bestScore} icon="star" color={c.streak} />
                <StatCard label="Avg score" value={analytics.averageScore} icon="activity" color={c.primary} />
              </View>

              <GlassCard style={styles.chartCard} padding={16}>
                <View style={styles.chartHeader}>
                  <View style={styles.periodToggle}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        { borderColor: c.glassBorder },
                        period === "week" && { backgroundColor: c.primary, borderColor: c.primary },
                      ]}
                      onPress={() => setPeriod("week")}
                    >
                      <Text style={[styles.toggleBtnText, { color: period === "week" ? c.primaryForeground : c.mutedForeground }]}>
                        7 Days
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        { borderColor: c.glassBorder },
                        period === "month" && { backgroundColor: c.primary, borderColor: c.primary },
                      ]}
                      onPress={() => setPeriod("month")}
                    >
                      <Text style={[
                        styles.toggleBtnText,
                        { color: period === "month" ? c.primaryForeground : c.mutedForeground },
                      ]}>
                        30 Days
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.metricToggle}>
                    {(["completionRate", "totalScore"] as const).map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.metricBtn,
                          { borderColor: c.glassBorder },
                          metric === m && { backgroundColor: c.accent, borderColor: c.primary },
                        ]}
                        onPress={() => setMetric(m)}
                      >
                        <Feather
                          name={m === "completionRate" ? "percent" : "star"}
                          size={13}
                          color={metric === m ? c.primary : c.mutedForeground}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <LineChart
                  data={period === "week" ? analytics.weeklyData : analytics.monthlyData}
                  metric={metric}
                  showLabels
                />

                <Text style={[styles.chartFooterText, { color: c.mutedForeground }]}>
                  {metric === "completionRate" ? "Completion rate" : "Score"} · {period === "week" ? "Last 7 days" : "Last 30 days"}
                </Text>
              </GlassCard>

              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Per-Task Breakdown</Text>
              {analytics.taskBreakdown.length === 0 ? (
                <GlassCard padding={24}><EmptyState icon="list" title="No task data yet" /></GlassCard>
              ) : (
                analytics.taskBreakdown.map((task) => (
                  <GlassCard key={task.taskId} style={styles.taskCard} padding={0}>
                    <View style={[styles.taskColorBar, { backgroundColor: task.color }]} />
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskName, { color: c.foreground }]}>{task.taskTitle}</Text>
                      <View style={styles.taskMeta}>
                        <View style={[styles.metaChip, { backgroundColor: c.successLight }]}>
                          <Text style={[styles.metaChipText, { color: c.success }]}>{task.completions} ✓</Text>
                        </View>
                        <View style={[styles.metaChip, { backgroundColor: c.failLight }]}>
                          <Text style={[styles.metaChipText, { color: c.fail }]}>{task.failures} ✗</Text>
                        </View>
                        {task.streak > 0 && (
                          <View style={[styles.metaChip, { backgroundColor: c.streakLight }]}>
                            <Text style={[styles.metaChipText, { color: c.streak }]}>{task.streak}d 🔥</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.taskRate}>
                      <Text style={[styles.taskRateValue, { color: task.completionRate > 50 ? c.success : c.fail }]}>
                        {task.completionRate}%
                      </Text>
                      <Text style={[styles.taskRateLabel, { color: c.mutedForeground }]}>rate</Text>
                    </View>
                  </GlassCard>
                ))
              )}
            </>
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
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  chartCard: { marginTop: 16, marginBottom: 24 },
  chartHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  periodToggle: { flexDirection: "row", gap: 6 },
  toggleBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  toggleBtnText: { fontSize: 12, fontWeight: "600" },
  metricToggle: { flexDirection: "row", gap: 6 },
  metricBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chartFooterText: { fontSize: 11, textAlign: "center", marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  taskCard: { marginBottom: 8, flexDirection: "row", alignItems: "center" },
  taskColorBar: { width: 4, alignSelf: "stretch", borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  taskInfo: { flex: 1, padding: 12 },
  taskName: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  taskMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  metaChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  metaChipText: { fontSize: 11, fontWeight: "600" },
  taskRate: { paddingRight: 14, alignItems: "center" },
  taskRateValue: { fontSize: 18, fontWeight: "700" },
  taskRateLabel: { fontSize: 10 },
});
