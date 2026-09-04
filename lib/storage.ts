import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DailyLog, HabitState, Task } from "@/types/habit";

const KEYS = {
  TASKS: "trackit:tasks",
  LOGS: "trackit:logs",
  STREAK: "trackit:streak",
  LONGEST_STREAK: "trackit:longest_streak",
  LAST_SYNCED: "trackit:last_synced",
  USER_ID: "trackit:user_id",
};

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}

export async function loadTasks(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(KEYS.TASKS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

export async function saveLogs(logs: DailyLog[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
}

export async function loadLogs(): Promise<DailyLog[]> {
  const raw = await AsyncStorage.getItem(KEYS.LOGS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DailyLog[];
  } catch {
    return [];
  }
}

export async function saveStreak(current: number, longest: number): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.STREAK, String(current)],
    [KEYS.LONGEST_STREAK, String(longest)],
  ]);
}

export async function loadStreak(): Promise<{ current: number; longest: number }> {
  const results = await AsyncStorage.multiGet([KEYS.STREAK, KEYS.LONGEST_STREAK]);
  return {
    current: Number(results[0][1] ?? 0),
    longest: Number(results[1][1] ?? 0),
  };
}

export async function saveUserId(userId: string | undefined): Promise<void> {
  if (userId) {
    await AsyncStorage.setItem(KEYS.USER_ID, userId);
  } else {
    await AsyncStorage.removeItem(KEYS.USER_ID);
  }
}

export async function loadUserId(): Promise<string | undefined> {
  const val = await AsyncStorage.getItem(KEYS.USER_ID);
  return val ?? undefined;
}

export async function saveLastSynced(isoDate: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_SYNCED, isoDate);
}

export async function loadLastSynced(): Promise<string | undefined> {
  const val = await AsyncStorage.getItem(KEYS.LAST_SYNCED);
  return val ?? undefined;
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export async function loadFullState(): Promise<Partial<HabitState>> {
  const [tasks, logs, streak, userId, lastSyncedAt] = await Promise.all([
    loadTasks(),
    loadLogs(),
    loadStreak(),
    loadUserId(),
    loadLastSynced(),
  ]);
  return {
    tasks,
    logs,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    userId,
    lastSyncedAt,
  };
}
