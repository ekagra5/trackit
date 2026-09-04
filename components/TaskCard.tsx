import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import type { DailyLogEntry, Task } from "@/types/habit";

const TASK_ICONS: Record<string, string> = {
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
  study: "bookmark",
  default: "check-circle",
};

interface TaskCardProps {
  task: Task;
  entry?: DailyLogEntry;
  onComplete: () => void;
  onFail: () => void;
  onPress: () => void;
  onEdit: () => void;
  showFailButton?: boolean;
}

export function TaskCard({ task, entry, onComplete, onFail, onPress, onEdit, showFailButton = false }: TaskCardProps) {
  const c = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const status = entry?.status ?? "pending";
  const isComplete = status === "complete";
  const isFailed = status === "failed";
  const isPending = status === "pending";
  const isLocked = !!task.locked;

  function animatePress(callback: () => void) {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    callback();
  }

  const iconName = TASK_ICONS[task.icon] ?? TASK_ICONS.default;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: c.card,
            borderColor: c.glassBorder,
            shadowColor: c.glassShadow,
          },
          isComplete && { backgroundColor: c.successLight, borderColor: c.success + "33" },
          isFailed && { backgroundColor: c.failLight, borderColor: c.fail + "33" },
        ]}
      >
        <View style={[styles.colorBar, { backgroundColor: task.color }]} />

        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: task.color + "22" }]}>
            <Feather name={iconName as any} size={18} color={task.color} />
          </View>
          {isLocked && (
            <View style={[styles.lockBadge, { backgroundColor: c.background }]}>
              <Feather name="lock" size={8} color={c.mutedForeground} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: c.foreground },
                (isComplete || isFailed) && { opacity: 0.5, textDecorationLine: "line-through" },
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
          </View>
          {task.description ? (
            <Text style={[styles.description, { color: c.mutedForeground }]} numberOfLines={1}>
              {task.description}
            </Text>
          ) : null}
          <View style={styles.meta}>
            <View style={[styles.scoreBadge, { backgroundColor: c.accent }]}>
              <Feather name="star" size={10} color={c.primary} />
              <Text style={[styles.scoreText, { color: c.accentForeground }]}>{task.score} pts</Text>
            </View>
            {isComplete && (
              <View style={[styles.statusBadge, { backgroundColor: c.successLight }]}>
                <Text style={[styles.statusText, { color: c.success }]}>✓ Done</Text>
              </View>
            )}
            {isFailed && (
              <View style={[styles.statusBadge, { backgroundColor: c.failLight }]}>
                <Text style={[styles.statusText, { color: c.fail }]}>✗ Failed</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          {isPending ? (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: c.successLight }]}
                onPress={() => animatePress(onComplete)}
                activeOpacity={0.7}
              >
                <Feather name="check" size={20} color={c.success} />
              </TouchableOpacity>
              {showFailButton && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: c.failLight, marginTop: 6 }]}
                  onPress={() => animatePress(onFail)}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={18} color={c.fail} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: c.muted }]}
              onPress={() => animatePress(() => onComplete())}
              activeOpacity={0.7}
            >
              <Feather name="rotate-ccw" size={15} color={c.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 10,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  colorBar: { width: 4, alignSelf: "stretch" },
  iconContainer: { paddingVertical: 16, paddingLeft: 12, paddingRight: 8, position: "relative" },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  lockBadge: {
    position: "absolute",
    bottom: 12,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  content: { flex: 1, paddingVertical: 14, paddingRight: 8 },
  title: { fontSize: 15, fontWeight: "600", marginBottom: 3, flex: 1 },
  description: { fontSize: 13, marginBottom: 6 },
  meta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  scoreBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  scoreText: { fontSize: 11, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  statusText: { fontSize: 11, fontWeight: "600" },
  actions: { paddingRight: 14, paddingLeft: 4, alignItems: "center", justifyContent: "center" },
  actionBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});
