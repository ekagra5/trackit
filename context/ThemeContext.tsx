import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getDarkMode, setDarkMode } from "@/lib/appSettings";

interface ThemeContextValue {
  isDark: boolean;
  toggleDark: () => void;
  setDark: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleDark: () => {},
  setDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    getDarkMode().then(setIsDark);
  }, []);

  const setDark = useCallback(async (value: boolean) => {
    setIsDark(value);
    await setDarkMode(value);
  }, []);

  const toggleDark = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await setDarkMode(next);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
