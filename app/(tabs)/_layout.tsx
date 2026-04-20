import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="health">
        <Icon sf={{ default: "heart", selected: "heart.fill" }} />
        <Label>Health</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="finance">
        <Icon sf={{ default: "chart.line.uptrend.xyaxis", selected: "chart.line.uptrend.xyaxis" }} />
        <Label>Finance</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="social">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Social</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ar">
        <Icon sf={{ default: "arkit", selected: "arkit" }} />
        <Label>AR</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ai">
        <Icon sf={{ default: "brain.head.profile", selected: "brain.head.profile" }} />
        <Label>AI</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="iot">
        <Icon sf={{ default: "house.and.flag", selected: "house.and.flag.fill" }} />
        <Label>IoT</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="blockchain">
        <Icon sf={{ default: "bitcoinsign.circle", selected: "bitcoinsign.circle.fill" }} />
        <Label>Chain</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function TabIcon({ name, color }: { name: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return <MaterialCommunityIcons name={name} size={22} color={color} />;
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "dark"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Inter_500Medium",
          marginBottom: isWeb ? 10 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={22} />
            ) : (
              <TabIcon name="view-dashboard" color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Health",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="heart.fill" tintColor={color} size={22} />
            ) : (
              <TabIcon name="heart-pulse" color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color }) => <TabIcon name="chart-line" color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          tabBarIcon: ({ color }) => <TabIcon name="account-group" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ar"
        options={{
          title: "AR",
          tabBarIcon: ({ color }) => <TabIcon name="cube-scan" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          tabBarIcon: ({ color }) => <TabIcon name="brain" color={color} />,
        }}
      />
      <Tabs.Screen
        name="iot"
        options={{
          title: "IoT",
          tabBarIcon: ({ color }) => <TabIcon name="home-automation" color={color} />,
        }}
      />
      <Tabs.Screen
        name="blockchain"
        options={{
          title: "Chain",
          tabBarIcon: ({ color }) => <TabIcon name="ethereum" color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
