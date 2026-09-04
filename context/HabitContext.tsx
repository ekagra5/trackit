import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { DailyLog, DailyLogEntry, HabitState, Task, TaskStatus } from "@/types/habit";
import {
  generateId,
  getTodayKey,
} from "@/lib/dateUtils";
import {
  loadFullState,
  saveLogs,
  saveTasks,
  saveStreak,
} from "@/lib/storage";
import {
  cancelTaskReminders,
  rescheduleAllReminders,
  scheduleTaskReminder,
} from "@/lib/notifications";
import { computeCurrentStreak, computeLongestStreak } from "@/lib/streakUtils";

const TASK_COLORS = [
  "#22C55E", "#3B82F6", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#EC4899", "#14B8A6",
];

type HabitAction =
  | { type: "LOAD_STATE"; payload: Partial<HabitState> }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "REORDER_TASKS"; payload: Task[] }
  | { type: "MARK_TASK"; payload: { taskId: string; status: TaskStatus; note?: string } }
  | { type: "SET_USER_ID"; payload: string | undefined }
  | { type: "SYNC_LOGS"; payload: DailyLog[] }
  | { type: "SYNC_TASKS"; payload: Task[] };

const initialState: HabitState = {
  tasks: [],
  logs: [],
  currentStreak: 0,
  longestStreak: 0,
};

function ensureTodayLog(logs: DailyLog[], tasks: Task[]): DailyLog[] {
  const todayKey = getTodayKey();
  const existing = logs.find((l) => l.date === todayKey);
  if (existing) return logs;

  const activeTasks = tasks.filter((t) => !t.archived);
  const maxScore = activeTasks.reduce((acc, t) => acc + t.score, 0);

  const newLog: DailyLog = {
    id: generateId(),
    date: todayKey,
    entries: activeTasks.map((t) => ({
      taskId: t.id,
      taskTitle: t.title,
      taskScore: t.score,
      status: "pending",
    })),
    totalScore: 0,
    maxScore,
    completionRate: 0,
    createdAt: new Date().toISOString(),
  };

  return [...logs, newLog];
}

function recalcLog(log: DailyLog): DailyLog {
  const completed = log.entries.filter((e) => e.status === "complete");
  const totalScore = completed.reduce((acc, e) => acc + e.taskScore, 0);
  const completionRate =
    log.entries.length > 0
      ? completed.length / log.entries.filter((e) => e.status !== "skipped").length
      : 0;
  return { ...log, totalScore, completionRate: isNaN(completionRate) ? 0 : completionRate };
}

function habitReducer(state: HabitState, action: HabitAction): HabitState {
  switch (action.type) {
    case "LOAD_STATE": {
      const merged = { ...state, ...action.payload };
      const logs = ensureTodayLog(merged.logs, merged.tasks);
      return { ...merged, logs };
    }

    case "ADD_TASK": {
      const tasks = [...state.tasks, action.payload];
      const logs = state.logs.map((log) => {
        if (log.date !== getTodayKey()) return log;
        const entry: DailyLogEntry = {
          taskId: action.payload.id,
          taskTitle: action.payload.title,
          taskScore: action.payload.score,
          status: "pending",
        };
        return recalcLog({
          ...log,
          entries: [...log.entries, entry],
          maxScore: log.maxScore + action.payload.score,
        });
      });
      return { ...state, tasks, logs };
    }

    case "UPDATE_TASK": {
      const tasks = state.tasks.map((t) =>
        t.id === action.payload.id ? action.payload : t
      );
      const logs = state.logs.map((log) => {
        const entries = log.entries.map((e) =>
          e.taskId === action.payload.id
            ? { ...e, taskTitle: action.payload.title, taskScore: action.payload.score }
            : e
        );
        const maxScore = entries.reduce((acc, e) => acc + e.taskScore, 0);
        return recalcLog({ ...log, entries, maxScore });
      });
      return { ...state, tasks, logs };
    }

    case "DELETE_TASK": {
      const tasks = state.tasks.filter((t) => t.id !== action.payload);
      const logs = state.logs.map((log) => {
        const entries = log.entries.filter((e) => e.taskId !== action.payload);
        const maxScore = entries.reduce((acc, e) => acc + e.taskScore, 0);
        return recalcLog({ ...log, entries, maxScore });
      });
      return { ...state, tasks, logs };
    }

    case "REORDER_TASKS": {
      return { ...state, tasks: action.payload };
    }

    case "MARK_TASK": {
      const { taskId, status, note } = action.payload;
      const logs = state.logs.map((log) => {
        if (log.date !== getTodayKey()) return log;
        const entries = log.entries.map((e) =>
          e.taskId === taskId
            ? { ...e, status, note, completedAt: status !== "pending" ? new Date().toISOString() : undefined }
            : e
        );
        return recalcLog({ ...log, entries });
      });
      const currentStreak = computeCurrentStreak(logs);
      const longestStreak = Math.max(state.longestStreak, computeLongestStreak(logs));
      return { ...state, logs, currentStreak, longestStreak };
    }

    case "SET_USER_ID": {
      return { ...state, userId: action.payload };
    }

    case "SYNC_LOGS": {
      return { ...state, logs: action.payload };
    }

    case "SYNC_TASKS": {
      return { ...state, tasks: action.payload };
    }

    default:
      return state;
  }
}

interface HabitContextValue {
  state: HabitState;
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "order">) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  markTask: (taskId: string, status: TaskStatus, note?: string) => void;
  getTodayLog: () => DailyLog | undefined;
  getNextTaskColor: () => string;
}

const HabitContext = createContext<HabitContextValue | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(habitReducer, initialState);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadFullState().then((loaded) => {
      dispatch({ type: "LOAD_STATE", payload: loaded });
    });
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    saveTasks(state.tasks);
    rescheduleAllReminders(state.tasks);
  }, [state.tasks]);

  useEffect(() => {
    if (!initialized.current) return;
    saveLogs(state.logs);
    saveStreak(state.currentStreak, state.longestStreak);
  }, [state.logs, state.currentStreak, state.longestStreak]);

  const addTask = useCallback(
    (taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "order">) => {
      const task: Task = {
        ...taskData,
        id: generateId(),
        order: state.tasks.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_TASK", payload: task });
      if (task.reminder.enabled) {
        scheduleTaskReminder(task);
      }
    },
    [state.tasks.length]
  );

  const updateTask = useCallback((task: Task) => {
    const updated = { ...task, updatedAt: new Date().toISOString() };
    dispatch({ type: "UPDATE_TASK", payload: updated });
    cancelTaskReminders(task.id).then(() => {
      if (task.reminder.enabled) {
        scheduleTaskReminder(updated);
      }
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    dispatch({ type: "DELETE_TASK", payload: taskId });
    cancelTaskReminders(taskId);
  }, []);

  const reorderTasks = useCallback((tasks: Task[]) => {
    dispatch({ type: "REORDER_TASKS", payload: tasks });
  }, []);

  const markTask = useCallback((taskId: string, status: TaskStatus, note?: string) => {
    dispatch({ type: "MARK_TASK", payload: { taskId, status, note } });
  }, []);

  const getTodayLog = useCallback(() => {
    const today = getTodayKey();
    return state.logs.find((l) => l.date === today);
  }, [state.logs]);

  const getNextTaskColor = useCallback(() => {
    const usedColors = state.tasks.map((t) => t.color);
    const unused = TASK_COLORS.find((c) => !usedColors.includes(c));
    return unused ?? TASK_COLORS[state.tasks.length % TASK_COLORS.length];
  }, [state.tasks]);

  return (
    <HabitContext.Provider
      value={{
        state,
        addTask,
        updateTask,
        deleteTask,
        reorderTasks,
        markTask,
        getTodayLog,
        getNextTaskColor,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabit(): HabitContextValue {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error("useHabit must be used within HabitProvider");
  return ctx;
}
