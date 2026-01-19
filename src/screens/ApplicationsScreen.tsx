/**
 * SpaceSaver - Applications Screen
 * View and manage installed applications
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { ApplicationsList, Card, Button } from '../components';
import { useStore } from '../store';
import { applicationService } from '../services';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

export const ApplicationsScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    applications,
    applicationSuggestions,
    setApplications,
    setApplicationSuggestions,
    addNotification,
  } = useStore();
  
  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await applicationService.scanApplications();
      setApplications(result.applications);
      setApplicationSuggestions(result.suggestions);
      
      if (result.suggestions.length > 0) {
        addNotification({
          type: 'info',
          title: 'Unused Apps Found',
          message: `${result.suggestions.length} apps haven't been used in a while.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load applications';
      setError(message);
      
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [setApplications, setApplicationSuggestions, addNotification]);
  
  useEffect(() => {
    if (applications.length === 0) {
      loadApplications();
    }
  }, []);
  
  // Empty state
  if (applications.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Card variant="elevated" style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📱</Text>
          <Text style={styles.emptyTitle}>Scan Applications</Text>
          <Text style={styles.emptyText}>
            Scan your installed applications to find unused apps that can be safely removed.
          </Text>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <Button
            title="Scan Now"
            onPress={loadApplications}
            loading={isLoading}
            style={styles.scanButton}
          />
        </Card>
      </View>
    );
  }
  
  // Loading state
  if (isLoading && applications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Card variant="elevated" style={styles.loadingCard}>
          <Text style={styles.loadingEmoji}>⏳</Text>
          <Text style={styles.loadingTitle}>Scanning Applications...</Text>
          <Text style={styles.loadingText}>
            This may take a moment while we analyze your installed apps.
          </Text>
        </Card>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <ApplicationsList
        applications={applications}
        suggestions={applicationSuggestions}
        onRefresh={loadApplications}
        isLoading={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.light,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background.light,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.light,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  scanButton: {
    minWidth: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background.light,
  },
  loadingCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  loadingTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.light,
    marginBottom: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ApplicationsScreen;
