import type { AnalyticsData, DailyLog, DayMetric, Task, TaskMetric } from "@/types/habit";
import {
  formatDateKey,
  getLast30Days,
  getLast7Days,
} from "./dateUtils";

export function computeAnalytics(logs: DailyLog[], tasks: Task[]): AnalyticsData {
  const last7 = getLast7Days();
  const last30 = getLast30Days();
  const logMap = new Map<string, DailyLog>(logs.map((l) => [l.date, l]));

  const toMetric = (dateKey: string): DayMetric => {
    const log = logMap.get(dateKey);
    if (!log) {
      return {
        date: dateKey,
        completionRate: 0,
        totalScore: 0,
        maxScore: 0,
        completed: 0,
        failed: 0,
      };
    }
    const completed = log.entries.filter((e) => e.status === "complete").length;
    const failed = log.entries.filter((e) => e.status === "failed").length;
    return {
      date: dateKey,
      completionRate: log.completionRate,
      totalScore: log.totalScore,
      maxScore: log.maxScore,
      completed,
      failed,
    };
  };

  const weeklyData = last7.map(toMetric);
  const monthlyData = last30.map(toMetric);

  const activeLogs7 = last7.map((d) => logMap.get(d)).filter(Boolean) as DailyLog[];
  const activeLogs30 = last30.map((d) => logMap.get(d)).filter(Boolean) as DailyLog[];

  const avgRate = (dayLogs: DailyLog[]) => {
    if (dayLogs.length === 0) return 0;
    return dayLogs.reduce((acc, l) => acc + l.completionRate, 0) / dayLogs.length;
  };

  const completionRate7Days = Math.round(avgRate(activeLogs7) * 100);
  const completionRate30Days = Math.round(avgRate(activeLogs30) * 100);

  const taskMetrics: TaskMetric[] = tasks
    .filter((t) => !t.archived)
    .map((task) => {
      let completions = 0;
      let failures = 0;
      let streak = 0;
      let streakBroken = false;

      const sortedDates = last30.slice().reverse();
      for (const date of sortedDates) {
        const log = logMap.get(date);
        if (!log) {
          if (!streakBroken) streakBroken = true;
          continue;
        }
        const entry = log.entries.find((e) => e.taskId === task.id);
        if (entry?.status === "complete") {
          if (!streakBroken) streak++;
          completions++;
        } else if (entry?.status === "failed") {
          if (!streakBroken) streakBroken = true;
          failures++;
        } else {
          if (!streakBroken) streakBroken = true;
        }
      }

      const total = completions + failures;
      return {
        taskId: task.id,
        taskTitle: task.title,
        color: task.color,
        completions,
        failures,
        completionRate: total > 0 ? Math.round((completions / total) * 100) : 0,
        streak,
      };
    });

  const allEntries = logs.flatMap((l) => l.entries);
  const totalCompletions = allEntries.filter((e) => e.status === "complete").length;
  const totalFailures = allEntries.filter((e) => e.status === "failed").length;

  const allScores = logs.map((l) => l.totalScore).filter((s) => s > 0);
  const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
  const averageScore =
    allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  const currentStreak = computeCurrentStreak(logs);
  const longestStreak = computeLongestStreak(logs);

  return {
    weeklyData,
    monthlyData,
    taskBreakdown: taskMetrics,
    completionRate7Days,
    completionRate30Days,
    currentStreak,
    longestStreak,
    totalCompletions,
    totalFailures,
    bestScore,
    averageScore,
  };
}

function computeCurrentStreak(logs: DailyLog[]): number {
  const today = formatDateKey(new Date());
  const sortedLogs = [...logs]
    .filter((l) => l.completionRate > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sortedLogs.length === 0) return 0;

  let streak = 0;
  let expected = today;
  for (const log of sortedLogs) {
    if (log.date === expected && log.completionRate > 0) {
      streak++;
      const d = new Date(log.date);
      d.setDate(d.getDate() - 1);
      expected = formatDateKey(d);
    } else {
      break;
    }
  }
  return streak;
}

function computeLongestStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;

  const sorted = [...logs]
    .filter((l) => l.completionRate > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return 0;

  let longest = 0;
  let current = 0;
  let prevDate: string | null = null;

  for (const log of sorted) {
    if (prevDate) {
      const prev = new Date(prevDate);
      prev.setDate(prev.getDate() + 1);
      const expected = formatDateKey(prev);
      if (log.date === expected) {
        current++;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }
    if (current > longest) longest = current;
    prevDate = log.date;
  }
  return longest;
}
