import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Line } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import type { DayMetric } from "@/types/habit";
import { getDayName, formatDisplayDate } from "@/lib/dateUtils";

interface LineChartProps {
  data: DayMetric[];
  metric?: "completionRate" | "totalScore";
  showLabels?: boolean;
}

const CHART_HEIGHT = 120;
const POINT_RADIUS = 5;
const PADDING = { top: 16, bottom: 32, left: 8, right: 8 };

export function LineChart({ data, metric = "completionRate", showLabels = true }: LineChartProps) {
  const c = useColors();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.empty, { height: CHART_HEIGHT }]}>
        <Text style={[styles.emptyText, { color: c.mutedForeground }]}>No data yet</Text>
      </View>
    );
  }

  const maxVal =
    metric === "totalScore"
      ? Math.max(...data.map((d) => Math.max(d.totalScore, d.maxScore)), 1)
      : 1;

  const POINT_WIDTH = data.length <= 10 ? 36 : 28;
  const chartWidth = Math.max(POINT_WIDTH * data.length, 280);
  const drawWidth = chartWidth - PADDING.left - PADDING.right;
  const drawHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  function getValue(d: DayMetric) {
    return metric === "completionRate" ? d.completionRate : d.totalScore;
  }

  function toX(i: number) {
    if (data.length === 1) return PADDING.left + drawWidth / 2;
    return PADDING.left + (i / (data.length - 1)) * drawWidth;
  }

  function toY(value: number) {
    return PADDING.top + drawHeight - (value / maxVal) * drawHeight;
  }

  function getPointColor(value: number) {
    const rate = metric === "completionRate" ? value : value / maxVal;
    if (rate <= 0) return c.border;
    if (rate < 0.33) return c.fail;
    if (rate < 0.66) return c.warning;
    return c.success;
  }

  const points = data.map((d, i) => ({
    x: toX(i),
    y: toY(getValue(d)),
    value: getValue(d),
    date: d.date,
    color: getPointColor(getValue(d)),
  }));

  const todayKey = new Date().toISOString().slice(0, 10);

  // Build smooth path using cubic bezier
  function buildPath() {
    if (points.length < 2) {
      if (points.length === 1) {
        return `M ${points[0].x} ${points[0].y}`;
      }
      return "";
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  // Build fill path (line + down to bottom + back)
  function buildFill() {
    if (points.length < 2) return "";
    const linePath = buildPath();
    const lastP = points[points.length - 1];
    const firstP = points[0];
    const bottom = PADDING.top + drawHeight;
    return `${linePath} L ${lastP.x} ${bottom} L ${firstP.x} ${bottom} Z`;
  }

  const linePath = buildPath();
  const fillPath = buildFill();
  const gradientId = `lineGrad_${metric}`;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      >
        <View style={{ width: chartWidth }}>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={c.primary} stopOpacity="0.25" />
                <Stop offset="1" stopColor={c.primary} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>

            {/* Baseline */}
            <Line
              x1={PADDING.left}
              y1={PADDING.top + drawHeight}
              x2={chartWidth - PADDING.right}
              y2={PADDING.top + drawHeight}
              stroke={c.border}
              strokeWidth={1}
            />

            {/* 50% guide line */}
            <Line
              x1={PADDING.left}
              y1={toY(maxVal * 0.5)}
              x2={chartWidth - PADDING.right}
              y2={toY(maxVal * 0.5)}
              stroke={c.border}
              strokeWidth={1}
              strokeDasharray="4 4"
            />

            {/* Fill under line */}
            {fillPath ? (
              <Path
                d={fillPath}
                fill={`url(#${gradientId})`}
              />
            ) : null}

            {/* Line */}
            {linePath ? (
              <Path
                d={linePath}
                stroke={c.primary}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Points */}
            {points.map((p, i) => {
              const isToday = data[i].date === todayKey;
              return (
                <Circle
                  key={data[i].date}
                  cx={p.x}
                  cy={p.y}
                  r={isToday ? POINT_RADIUS + 2 : POINT_RADIUS}
                  fill={p.value <= 0 ? c.background : p.color}
                  stroke={isToday ? c.primary : p.color}
                  strokeWidth={isToday ? 2.5 : 1.5}
                />
              );
            })}
          </Svg>

          {showLabels && (
            <View style={[styles.labelsRow, { width: chartWidth, paddingHorizontal: PADDING.left }]}>
              {data.map((d, i) => {
                const isToday = d.date === todayKey;
                const label =
                  data.length <= 7
                    ? getDayName(d.date)
                    : formatDisplayDate(d.date).split(" ")[0];
                const x = toX(i);
                return (
                  <View
                    key={d.date}
                    style={[styles.labelWrap, { position: "absolute", left: x - 16, width: 32 }]}
                  >
                    <Text
                      style={[
                        styles.label,
                        { color: isToday ? c.primary : c.mutedForeground },
                        isToday && styles.todayLabel,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 13 },
  labelsRow: { height: 20, position: "relative" },
  labelWrap: { alignItems: "center" },
  label: { fontSize: 9 },
  todayLabel: { fontWeight: "700" },
});
