import type { DailyLog } from "@/types/habit";
import { formatDateKey } from "./dateUtils";

export function computeCurrentStreak(logs: DailyLog[]): number {
  const today = formatDateKey(new Date());
  const qualifyingLogs = logs
    .filter((l) => l.completionRate > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (qualifyingLogs.length === 0) return 0;

  let streak = 0;
  let expected = today;

  for (const log of qualifyingLogs) {
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

export function computeLongestStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;

  const sorted = logs
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
