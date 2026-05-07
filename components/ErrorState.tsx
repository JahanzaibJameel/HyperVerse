import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { GlowCard } from '@/components/GlowCard';
import { NeonButton } from '@/components/NeonButton';
import { useColors } from '@/hooks/useColors';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: string;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  icon = 'alert-circle-outline',
  retryText = 'Retry',
}) => {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <GlowCard style={styles.errorCard} glowColor={colors.error}>
        <View style={styles.content}>
          <MaterialCommunityIcons name={icon} size={64} color={colors.error} />
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>
            {message}
          </Text>
          {onRetry && (
            <NeonButton
              label={retryText}
              onPress={onRetry}
              size="md"
              color={colors.error}
            />
          )}
        </View>
      </GlowCard>
    </View>
  );
};

interface NetworkErrorStateProps {
  onRetry?: () => void;
}

export const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({ onRetry }) => {
  const colors = useColors();

  return (
    <ErrorState
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      icon="wifi-off"
      retryText="Try Again"
    />
  );
};

interface DataErrorStateProps {
  onRetry?: () => void;
  dataType?: string;
}

export const DataErrorState: React.FC<DataErrorStateProps> = ({ 
  onRetry, 
  dataType = 'data' 
}) => {
  const colors = useColors();

  return (
    <ErrorState
      title={`Failed to load ${dataType}`}
      message={`We couldn't load your ${dataType}. Please refresh to try again.`}
      onRetry={onRetry}
      icon="database-off"
      retryText="Refresh"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorCard: {
    width: '100%',
    maxWidth: 320,
    padding: 32,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
