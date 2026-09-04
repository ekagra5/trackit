import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Task } from "@/types/habit";
import { formatTime } from "./dateUtils";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleTaskReminder(task: Task): Promise<void> {
  if (Platform.OS === "web") return;
  if (!task.reminder.enabled || task.reminder.repeatDays.length === 0) return;

  await cancelTaskReminders(task.id);

  const [hourStr, minuteStr] = task.reminder.time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  for (const day of task.reminder.repeatDays) {
    await Notifications.scheduleNotificationAsync({
      identifier: `task-${task.id}-day-${day}`,
      content: {
        title: task.title,
        body: `Time for your habit! Tap to mark complete.`,
        data: { taskId: task.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day + 1,
        hour,
        minute,
      },
    });
  }
}

export async function cancelTaskReminders(taskId: string): Promise<void> {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.identifier.startsWith(`task-${taskId}-`)) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function rescheduleAllReminders(tasks: Task[]): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelAllReminders();
  for (const task of tasks) {
    if (!task.archived && task.reminder.enabled) {
      await scheduleTaskReminder(task);
    }
  }
}

export async function sendStreakReminderLocal(streak: number): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.scheduleNotificationAsync({
    identifier: "streak-reminder",
    content: {
      title: "Don't break your streak!",
      body: `You're on a ${streak}-day streak. Complete your habits today!`,
      sound: true,
    },
    trigger: null,
  });
}

export function formatReminderDays(days: number[]): string {
  if (days.length === 0) return "Never";
  if (days.length === 7) return "Every day";
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (
    days.length === 5 &&
    days.includes(1) &&
    days.includes(2) &&
    days.includes(3) &&
    days.includes(4) &&
    days.includes(5)
  ) {
    return "Weekdays";
  }
  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return "Weekends";
  }
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => names[d])
    .join(", ");
}
