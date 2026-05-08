import React from 'react';
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

import { useColors } from '@/hooks/useColors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  style?: any;
  animationDuration?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  style,
  animationDuration = 1000,
}) => {
  const colors = useColors();
  const shimmerValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [shimmerValue, animationDuration]);

  const shimmerStyle = {
    opacity: shimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    }),
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          backgroundColor: colors.border,
        },
        shimmerStyle,
        style,
      ]}
    />
  );
};

interface TaskCardSkeletonProps {
  count?: number;
}

export const TaskCardSkeleton: React.FC<TaskCardSkeletonProps> = ({ count = 3 }) => {
  const colors = useColors();
  
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.cardSkeleton, { borderColor: colors.border }]}>
          <View style={styles.headerSkeleton}>
            <View style={styles.titleSkeleton}>
              <SkeletonLoader width="60%" height={16} />
              <SkeletonLoader width="40%" height={12} style={{ marginTop: 4 }} />
            </View>
            <SkeletonLoader width={24} height={24} />
          </View>
          <SkeletonLoader width="100%" height={14} style={{ marginVertical: 8 }} />
          <View style={styles.footerSkeleton}>
            <View style={styles.tagsSkeleton}>
              <SkeletonLoader width={60} height={20} />
              <SkeletonLoader width={60} height={20} style={{ marginLeft: 8 }} />
            </View>
            <SkeletonLoader width={80} height={16} />
          </View>
        </View>
      ))}
    </View>
  );
};

interface StatsCardSkeletonProps {
  count?: number;
}

export const StatsCardSkeleton: React.FC<StatsCardSkeletonProps> = ({ count = 3 }) => {
  return (
    <View style={styles.statsContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.statCardSkeleton}>
          <SkeletonLoader width={40} height={24} />
          <SkeletonLoader width={60} height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 4,
  },
  container: {
    gap: 12,
  },
  cardSkeleton: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSkeleton: {
    flex: 1,
    marginRight: 12,
  },
  footerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardSkeleton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    gap: 4,
  },
});
