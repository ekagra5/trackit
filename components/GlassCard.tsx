import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  padding?: number;
}

export function GlassCard({ children, style, intensity = 70, padding = 16 }: GlassCardProps) {
  const c = useColors();
  const { isDark } = useTheme();

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensity}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.base,
          { borderColor: c.glassBorder, shadowColor: c.glassShadow, padding },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: c.card, borderColor: c.glassBorder, shadowColor: c.glassShadow, padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
});
