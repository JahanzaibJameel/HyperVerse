import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

interface MiniBarChartProps {
  data: number[];
  labels?: string[];
  color: string;
  height?: number;
  accentIndex?: number;
}

export function MiniBarChart({
  data,
  labels,
  color,
  height = 90,
  accentIndex,
}: MiniBarChartProps) {
  const colors = useColors();
  const max = Math.max(...data, 1);
  const barWidth = 28;
  const gap = 8;
  const totalWidth = data.length * (barWidth + gap) - gap;

  return (
    <View>
      <Svg width={totalWidth} height={height} style={{ overflow: "visible" }}>
        <Defs>
          <LinearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0.4" />
          </LinearGradient>
          <LinearGradient id="barGradInactive" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.4" />
            <Stop offset="1" stopColor={color} stopOpacity="0.1" />
          </LinearGradient>
        </Defs>
        {data.map((v, i) => {
          const barH = Math.max((v / max) * height, 4);
          const isAccent = i === accentIndex;
          return (
            <Rect
              key={i}
              x={i * (barWidth + gap)}
              y={height - barH}
              width={barWidth}
              height={barH}
              rx={6}
              fill={isAccent ? "url(#barGradActive)" : "url(#barGradInactive)"}
            />
          );
        })}
      </Svg>
      {labels && (
        <View style={[styles.labels, { width: totalWidth }]}>
          {labels.map((l, i) => (
            <Text
              key={i}
              style={[
                styles.label,
                {
                  color: i === accentIndex ? color : colors.mutedForeground,
                  width: barWidth,
                  fontFamily: i === accentIndex ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
            >
              {l}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: "row", gap: 8, marginTop: 6 },
  label: { fontSize: 9, textAlign: "center" },
});
