import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassBackground } from "@/components/GlassBackground";
import { GlassCard } from "@/components/GlassCard";
import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    title: "Information We Collect",
    content: `TrackIt is designed with your privacy as a foundation — not an afterthought.

Everything the app stores is created by you:

• Habit tasks you create (stored locally on your device)
• Daily completion logs (stored locally on your device)
• App preferences and settings (stored locally on your device)

We do not collect your name, email, location, device identifiers, usage analytics, or any personally identifiable information.`,
  },
  {
    title: "Local-First Storage",
    content: `All your data lives on your device using AsyncStorage. Nothing is uploaded anywhere — TrackIt has no server and makes no network requests with your data.

Your habit data, streaks, and logs are entirely private by default. Uninstalling the app removes all data permanently from your device.`,
  },
  {
    title: "No Accounts, No Payments",
    content: `TrackIt does not require sign-up or login, and there is nothing to purchase. Every feature is available to every user, for free, forever.`,
  },
  {
    title: "Push Notifications",
    content: `If you enable reminders, local notifications are scheduled entirely on your device using the operating system's built-in notification system.

TrackIt does not use any third-party notification or tracking service.`,
  },
  {
    title: "No Ads, No Tracking",
    content: `TrackIt does not display advertisements and does not use analytics or tracking SDKs of any kind. There is nothing to sell, rent, or share, because nothing leaves your device.`,
  },
  {
    title: "Open Source",
    content: `TrackIt is free and open source software. You can read every line of code that runs on your device, verify these claims yourself, and contribute changes.`,
  },
  {
    title: "Your Rights",
    content: `You have the right to:
• Access all your data (it's on your device)
• Delete your data at any time (Settings → Clear All Data, or uninstall the app)

Because no data ever leaves your device, there is nothing for us to access, sell, or be asked to delete on your behalf.`,
  },
  {
    title: "Children's Privacy",
    content: `TrackIt is not directed at children under 13 and does not knowingly collect data from anyone, of any age — all data stays on-device regardless of who uses the app.`,
  },
  {
    title: "Changes to This Policy",
    content: `This Privacy Policy may be updated as the app evolves. Since TrackIt is open source, any change to this policy is visible in the project's version history.`,
  },
];

export default function PrivacyScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={styles.container}>
      <GlassBackground>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: topInset + 8, paddingBottom: bottomInset + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: c.glass, borderColor: c.glassBorder }]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={18} color={c.foreground} />
            <Text style={[styles.backText, { color: c.foreground }]}>Settings</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: c.accent }]}>
              <Feather name="shield" size={28} color={c.primary} />
            </View>
            <Text style={[styles.title, { color: c.foreground }]}>Privacy Policy</Text>
            <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
              Your privacy is not a feature — it is the foundation of TrackIt.
            </Text>
          </View>

          <GlassCard style={styles.commitmentCard} padding={20}>
            <View style={styles.commitmentRow}>
              <Feather name="check-circle" size={16} color={c.primary} />
              <Text style={[styles.commitmentText, { color: c.foreground }]}>No data collected. Ever.</Text>
            </View>
            <View style={styles.commitmentRow}>
              <Feather name="check-circle" size={16} color={c.primary} />
              <Text style={[styles.commitmentText, { color: c.foreground }]}>Offline-first. Data stays on your device.</Text>
            </View>
            <View style={styles.commitmentRow}>
              <Feather name="check-circle" size={16} color={c.primary} />
              <Text style={[styles.commitmentText, { color: c.foreground }]}>Zero ads. Zero tracking.</Text>
            </View>
            <View style={styles.commitmentRow}>
              <Feather name="check-circle" size={16} color={c.primary} />
              <Text style={[styles.commitmentText, { color: c.foreground }]}>Free and open source.</Text>
            </View>
          </GlassCard>

          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>{section.title}</Text>
              <GlassCard padding={16} style={styles.sectionCard}>
                <Text style={[styles.sectionContent, { color: c.foreground }]}>{section.content}</Text>
              </GlassCard>
            </View>
          ))}
        </ScrollView>
      </GlassBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    marginBottom: 20,
  },
  backText: { fontSize: 14, fontWeight: "500" },
  header: { alignItems: "center", marginBottom: 24 },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 16 },
  commitmentCard: { marginBottom: 28 },
  commitmentRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  commitmentText: { fontSize: 14, fontWeight: "500" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8, paddingHorizontal: 4 },
  sectionCard: {},
  sectionContent: { fontSize: 13, lineHeight: 20 },
});
