import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  showFailButton: "app_setting_showFailButton",
  darkMode: "app_setting_darkMode",
  autoSortTasks: "app_setting_autoSortTasks",
  showDailyQuote: "app_setting_showDailyQuote",
  dailyResetHour: "app_setting_dailyResetHour",
};

async function getBool(key: string, defaultValue = false): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val === null ? defaultValue : val === "true";
  } catch {
    return defaultValue;
  }
}

async function setBool(key: string, value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value ? "true" : "false");
  } catch {}
}

async function getNumber(key: string, defaultValue: number): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val === null ? defaultValue : parseInt(val, 10);
  } catch {
    return defaultValue;
  }
}

async function setNumber(key: string, value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key, String(value));
  } catch {}
}

export const getShowFailButton = () => getBool(KEYS.showFailButton, false);
export const setShowFailButton = (v: boolean) => setBool(KEYS.showFailButton, v);

export const getDarkMode = () => getBool(KEYS.darkMode, false);
export const setDarkMode = (v: boolean) => setBool(KEYS.darkMode, v);

export const getAutoSortTasks = () => getBool(KEYS.autoSortTasks, true);
export const setAutoSortTasks = (v: boolean) => setBool(KEYS.autoSortTasks, v);

export const getShowDailyQuote = () => getBool(KEYS.showDailyQuote, true);
export const setShowDailyQuote = (v: boolean) => setBool(KEYS.showDailyQuote, v);

export const getDailyResetHour = () => getNumber(KEYS.dailyResetHour, 0);
export const setDailyResetHour = (v: number) => setNumber(KEYS.dailyResetHour, v);
