export type TaskStatus = "pending" | "complete" | "failed" | "skipped";

export interface ReminderConfig {
  enabled: boolean;
  time: string;
  repeatDays: number[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  score: number;
  order: number;
  color: string;
  icon: string;
  reminder: ReminderConfig;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  locked?: boolean;
}

export interface DailyLogEntry {
  taskId: string;
  taskTitle: string;
  taskScore: number;
  status: TaskStatus;
  completedAt?: string;
  note?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  entries: DailyLogEntry[];
  totalScore: number;
  maxScore: number;
  completionRate: number;
  createdAt: string;
}

export interface HabitState {
  tasks: Task[];
  logs: DailyLog[];
  currentStreak: number;
  longestStreak: number;
  lastSyncedAt?: string;
  userId?: string;
}

export interface AnalyticsData {
  weeklyData: DayMetric[];
  monthlyData: DayMetric[];
  taskBreakdown: TaskMetric[];
  completionRate7Days: number;
  completionRate30Days: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  totalFailures: number;
  bestScore: number;
  averageScore: number;
}

export interface DayMetric {
  date: string;
  completionRate: number;
  totalScore: number;
  maxScore: number;
  completed: number;
  failed: number;
}

export interface TaskMetric {
  taskId: string;
  taskTitle: string;
  color: string;
  completions: number;
  failures: number;
  completionRate: number;
  streak: number;
}
