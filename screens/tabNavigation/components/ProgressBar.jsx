// components/ProgressBar.jsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import {
  ProgressBar as PaperProgressBar,
  Text,
  Surface,
  useTheme,
  Card,
  Badge,
  ActivityIndicator,
} from 'react-native-paper';

/**
 * Dynamic Progress Bar Component with React Native Paper
 * Integrated with SSE for real-time upload progress
 *
 * @param {Object} props
 * @param {number} props.progress - Progress value (0-100)
 * @param {string} props.message - Progress message to display
 * @param {boolean} props.visible - Show/hide progress bar
 * @param {string} props.variant - Style variant ('default', 'minimal', 'detailed', 'card')
 * @param {boolean} props.showPercentage - Show percentage text
 * @param {boolean} props.showMessage - Show progress message
 * @param {string} props.color - Progress bar color (uses theme colors)
 * @param {boolean} props.animated - Enable animations
 * @param {boolean} props.indeterminate - Show indeterminate loading (for initial connection)
 */
const ProgressBar = ({
  progress = 0,
  message = '',
  visible = true,
  variant = 'default',
  showPercentage = true,
  showMessage = true,
  color,
  animated = true,
  indeterminate = false,
  style,
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  // Normalize progress to 0-1 range for Paper's ProgressBar
  const normalizedProgress = Math.max(0, Math.min(100, progress)) / 100;

  // Determine color based on progress
  const getProgressColor = () => {
    if (color) return color;

    if (progress >= 100) {
      return '#4CAF50'; // Green for complete
    } else if (progress >= 75) {
      return theme.colors.primary;
    } else if (progress >= 50) {
      return theme.colors.secondary;
    } else if (progress >= 25) {
      return '#FF9800'; // Orange
    } else if (progress > 0) {
      return theme.colors.primary;
    }
    return theme.colors.disabled;
  };

  // Animate progress value
  useEffect(() => {
    if (animated) {
      Animated.spring(progressValue, {
        toValue: normalizedProgress,
        friction: 10,
        tension: 40,
        useNativeDriver: false,
      }).start();
    }
  }, [normalizedProgress, animated]);

  // Fade in/out animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Get status badge info
  const getStatusInfo = () => {
    if (indeterminate) {
      return { icon: '🔄', text: 'Connecting', color: theme.colors.primary };
    }
    if (progress === 0) {
      return { icon: '⏳', text: 'Waiting', color: theme.colors.outline };
    }
    if (progress >= 100) {
      return { icon: '✓', text: 'Complete', color: '#4CAF50' };
    }
    return { icon: '⚡', text: 'Uploading', color: theme.colors.secondary };
  };

  const statusInfo = getStatusInfo();

  if (!visible) return null;

  // Render based on variant
  const renderContent = () => {
    switch (variant) {
      case 'minimal':
        return renderMinimalVariant();
      case 'detailed':
        return renderDetailedVariant();
      case 'card':
        return renderCardVariant();
      default:
        return renderDefaultVariant();
    }
  };

  // Default variant
  const renderDefaultVariant = () => (
    <Surface style={[styles.surface, style]} elevation={2}>
      {showMessage && message && (
        <Text variant="bodyMedium" style={styles.messageText}>
          {message}
        </Text>
      )}

      <View style={styles.progressContainer}>
        <PaperProgressBar
          progress={indeterminate ? undefined : normalizedProgress}
          color={getProgressColor()}
          style={styles.progressBar}
          indeterminate={indeterminate}
        />
      </View>

      <View style={styles.statusRow}>
        {showPercentage && !indeterminate && (
          <Text variant="titleLarge" style={styles.percentageText}>
            {Math.round(progress)}%
          </Text>
        )}

        <Badge style={[styles.badge, { backgroundColor: statusInfo.color }]}>
          {statusInfo.icon} {statusInfo.text}
        </Badge>
      </View>
    </Surface>
  );

  // Minimal variant - compact view
  const renderMinimalVariant = () => (
    <Surface style={[styles.minimalSurface, style]} elevation={1}>
      <View style={styles.minimalRow}>
        {showMessage && message && (
          <Text
            variant="bodySmall"
            style={styles.minimalMessage}
            numberOfLines={1}>
            {message}
          </Text>
        )}
        {showPercentage && !indeterminate && (
          <Text variant="labelSmall" style={styles.minimalPercentage}>
            {Math.round(progress)}%
          </Text>
        )}
      </View>
      <PaperProgressBar
        progress={indeterminate ? undefined : normalizedProgress}
        color={getProgressColor()}
        style={styles.minimalProgressBar}
        indeterminate={indeterminate}
      />
    </Surface>
  );

  // Detailed variant - with all info
  const renderDetailedVariant = () => (
    <Surface style={[styles.detailedSurface, style]} elevation={3}>
      <View style={styles.detailedHeader}>
        <View style={styles.detailedHeaderLeft}>
          {indeterminate ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text variant="displaySmall" style={styles.detailedPercentage}>
              {Math.round(progress)}%
            </Text>
          )}
        </View>

        <View style={styles.detailedHeaderRight}>
          <Badge
            size={28}
            style={[styles.detailedBadge, { backgroundColor: statusInfo.color }]}>
            {statusInfo.text}
          </Badge>
        </View>
      </View>

      {showMessage && message && (
        <Text variant="bodyLarge" style={styles.detailedMessage}>
          {message}
        </Text>
      )}

      <PaperProgressBar
        progress={indeterminate ? undefined : normalizedProgress}
        color={getProgressColor()}
        style={styles.detailedProgressBar}
        indeterminate={indeterminate}
      />

      <View style={styles.detailedFooter}>
        <Text variant="labelSmall" style={styles.detailedFooterText}>
          {indeterminate
            ? 'Establishing connection...'
            : progress >= 100
            ? 'Upload completed successfully'
            : progress > 0
            ? `${Math.round(progress)}% uploaded`
            : 'Ready to upload'}
        </Text>
      </View>
    </Surface>
  );

  // Card variant - Material Design 3 card style
  const renderCardVariant = () => (
    <Card style={[styles.card, style]} elevation={2}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Upload Progress
            </Text>
            {showMessage && message && (
              <Text variant="bodySmall" style={styles.cardSubtitle}>
                {message}
              </Text>
            )}
          </View>

          {indeterminate ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <View style={styles.cardPercentageContainer}>
              <Text variant="headlineMedium" style={styles.cardPercentage}>
                {Math.round(progress)}
              </Text>
              <Text variant="bodySmall" style={styles.cardPercentageSymbol}>
                %
              </Text>
            </View>
          )}
        </View>

        <PaperProgressBar
          progress={indeterminate ? undefined : normalizedProgress}
          color={getProgressColor()}
          style={styles.cardProgressBar}
          indeterminate={indeterminate}
        />

        <View style={styles.cardFooter}>
          <Text variant="labelMedium" style={{ color: statusInfo.color }}>
            {statusInfo.icon} {statusInfo.text}
          </Text>

          {!indeterminate && progress > 0 && progress < 100 && (
            <Text variant="labelSmall" style={styles.cardFooterRight}>
              {(100 - progress).toFixed(0)}% remaining
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}>
      {renderContent()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Default variant styles
  surface: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  messageText: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  percentageText: {
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
  },

  // Minimal variant styles
  minimalSurface: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  minimalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  minimalMessage: {
    flex: 1,
    marginRight: 8,
  },
  minimalPercentage: {
    fontWeight: 'bold',
  },
  minimalProgressBar: {
    height: 4,
    borderRadius: 2,
  },

  // Detailed variant styles
  detailedSurface: {
    padding: 20,
    borderRadius: 16,
    marginVertical: 12,
  },
  detailedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailedHeaderLeft: {
    flex: 1,
  },
  detailedHeaderRight: {
    marginLeft: 16,
  },
  detailedPercentage: {
    fontWeight: 'bold',
  },
  detailedBadge: {
    paddingHorizontal: 12,
  },
  detailedMessage: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  detailedProgressBar: {
    height: 12,
    borderRadius: 6,
  },
  detailedFooter: {
    marginTop: 12,
    alignItems: 'center',
  },
  detailedFooterText: {
    opacity: 0.7,
  },

  // Card variant styles
  card: {
    marginVertical: 12,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    opacity: 0.7,
  },
  cardPercentageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardPercentage: {
    fontWeight: 'bold',
  },
  cardPercentageSymbol: {
    marginLeft: 2,
    marginTop: 4,
    opacity: 0.7,
  },
  cardProgressBar: {
    height: 10,
    borderRadius: 5,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardFooterRight: {
    opacity: 0.6,
  },
});

export default ProgressBar;