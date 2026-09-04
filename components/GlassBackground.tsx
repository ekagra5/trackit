import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";

const LIGHT: [string, string, string] = ["#E0F2FE", "#F0FDF4", "#EDE9FE"];
const DARK: [string, string, string] = ["#0B1120", "#0C1A0E", "#110B1F"];

interface GlassBackgroundProps {
  children: React.ReactNode;
  style?: object;
}

export function GlassBackground({ children, style }: GlassBackgroundProps) {
  const { isDark } = useTheme();
  return (
    <LinearGradient
      colors={isDark ? DARK : LIGHT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
    >
      {children}
    </LinearGradient>
  );
}
