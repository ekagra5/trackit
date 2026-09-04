import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

/**
 * Returns design tokens for the current theme (light or dark).
 * Reads from ThemeContext — toggled via the dark mode switch in Settings.
 */
export function useColors() {
  const { isDark } = useTheme();
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, isDark, radius: colors.radius };
}
