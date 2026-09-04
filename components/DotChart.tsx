import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { DayMetric } from "@/types/habit";
import { formatDisplayDate, getDayName } from "@/lib/dateUtils";

interface DotChartProps {
  data: DayMetric[];
  metric?: "completionRate" | "totalScore";
  showLabels?: boolean;
  compact?: boolean;
}

export function DotChart({ data, metric = "completionRate", showLabels = true, compact = false }: DotChartProps) {
  const c = useColors();

  const maxVal = metric === "totalScore"
    ? Math.max(...data.map((d) => d.maxScore), 1)
    : 1;

  function getDotColor(value: number): string {
    const rate = metric === "completionRate" ? value : value / maxVal;
    if (rate === 0) return c.border;
    if (rate < 0.33) return c.fail;
    if (rate < 0.66) return c.warning;
    return c.success;
  }

  function getDotSize(value: number): number {
    const rate = metric === "completionRate" ? value : value / maxVal;
    const min = compact ? 6 : 8;
    const max = compact ? 18 : 24;
    return min + (max - min) * rate;
  }

  const containerHeight = compact ? 44 : 60;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {data.map((item) => {
        const value = metric === "completionRate" ? item.completionRate : item.totalScore;
        const dotSize = getDotSize(value);
        const dotColor = getDotColor(value);
        const isToday = item.date === new Date().toISOString().split("T")[0];

        return (
          <View key={item.date} style={[styles.dayColumn, compact && styles.dayColumnCompact]}>
            <View style={[styles.dotContainer, { height: containerHeight }]}>
              <View
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: dotColor,
                  },
                  isToday && styles.todayDot,
                  isToday && { borderColor: c.primary },
                ]}
              />
            </View>
            {showLabels && (
              <Text style={[styles.label, { color: isToday ? c.primary : c.mutedForeground }, isToday && styles.todayLabel]}>
                {data.length <= 7 ? getDayName(item.date) : formatDisplayDate(item.date).split(" ")[0]}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 4,
    alignItems: "flex-end",
    gap: 2,
  },
  dayColumn: {
    width: 36,
    alignItems: "center",
  },
  dayColumnCompact: {
    width: 28,
  },
  dotContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    opacity: 0.9,
  },
  todayDot: {
    borderWidth: 2,
    opacity: 1,
  },
  label: {
    fontSize: 9,
    marginTop: 4,
  },
  todayLabel: {
    fontWeight: "700",
  },
});
