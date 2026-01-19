/**
 * SpaceSaver - Dashboard Screen
 * Main overview screen showing disk status and quick actions
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { DiskOverview, Card, ProgressBar, Button } from '../components';
import { useScanner, useCleanup, useAutoMode } from '../hooks';
import { useStore, useCleanupTargets } from '../store';
import { predictionService, scannerService } from '../services';
import { COLORS, SPACING, FONT_SIZES, formatBytes } from '../constants';

export const DashboardScreen: React.FC = () => {
  const { isScanning, progress, startScan, quickScan } = useScanner();
  const { startCleanup } = useCleanup();
  const autoMode = useAutoMode();
  
  const {
    prediction,
    setPrediction,
    cleanupRules,
    cleanupHistory,
    addNotification,
  } = useStore();
  
  const cleanupTargets = useCleanupTargets();
  
  // Load initial data
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = useCallback(async () => {
    try {
      // Record usage and get prediction
      await predictionService.recordUsage();
      const pred = await predictionService.getPrediction();
      setPrediction(pred);
      
      // Quick scan for overview
      await quickScan();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [setPrediction, quickScan]);
  
  const handleScan = useCallback(async () => {
    await startScan(cleanupRules);
  }, [startScan, cleanupRules]);
  
  const handleCleanup = useCallback(async () => {
    if (cleanupTargets.filter(t => t.selected).length === 0) {
      // Run a quick cleanup with low-risk items
      const result = await scannerService.quickScan(cleanupRules);
      
      addNotification({
        type: 'info',
        title: 'Quick Scan Complete',
        message: `Found ${formatBytes(result.estimatedSavings)} that can be cleaned. Run a full scan to select items.`,
      });
    } else {
      await startCleanup();
    }
  }, [cleanupTargets, cleanupRules, startCleanup, addNotification]);
  
  // Calculate recent savings
  const recentSavings = cleanupHistory
    .slice(0, 5)
    .reduce((sum, r) => sum + r.spaceFreed, 0);
  
  // Get category breakdown
  const categoryBreakdown = cleanupTargets.reduce((acc, t) => {
    const cat = t.file.category;
    acc[cat] = (acc[cat] || 0) + t.file.size;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isScanning}
          onRefresh={loadData}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Main disk overview */}
      <DiskOverview
        onScanPress={handleScan}
        onCleanupPress={handleCleanup}
        isScanning={isScanning}
      />
      
      {/* Scan progress */}
      {isScanning && progress && (
        <Card variant="elevated" style={styles.progressCard}>
          <Text style={styles.progressTitle}>Scanning...</Text>
          <Text style={styles.progressPath} numberOfLines={1}>
            {progress.currentPath || 'Preparing...'}
          </Text>
          <ProgressBar
            progress={progress.progress}
            showPercentage
            height={8}
            style={styles.progressBar}
          />
          <Text style={styles.progressStats}>
            {progress.filesScanned} files scanned • {formatBytes(progress.totalSize)} found
          </Text>
        </Card>
      )}
      
      {/* Auto Mode Status */}
      <Card variant="elevated" style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusTitle}>Auto Mode</Text>
            <Text style={styles.statusSubtitle}>
              {autoMode.isEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Button
            title={autoMode.isEnabled ? 'Disable' : 'Enable'}
            variant={autoMode.isEnabled ? 'outline' : 'primary'}
            size="small"
            onPress={autoMode.toggle}
          />
        </View>
        
        {autoMode.isEnabled && (
          <View style={styles.autoModeInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Interval:</Text>
              <Text style={styles.infoValue}>
                Every {autoMode.config.intervalMinutes} minutes
              </Text>
            </View>
            {autoMode.lastRunTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last run:</Text>
                <Text style={styles.infoValue}>
                  {autoMode.lastRunTime.toLocaleTimeString()}
                </Text>
              </View>
            )}
            {autoMode.lastSpaceFreed > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last cleanup:</Text>
                <Text style={[styles.infoValue, styles.successValue]}>
                  {formatBytes(autoMode.lastSpaceFreed)} freed
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
      
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statEmoji}>🧹</Text>
          <Text style={styles.statValue}>
            {cleanupHistory.length}
          </Text>
          <Text style={styles.statLabel}>Cleanups</Text>
        </Card>
        
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statEmoji}>💾</Text>
          <Text style={[styles.statValue, styles.successValue]}>
            {formatBytes(recentSavings)}
          </Text>
          <Text style={styles.statLabel}>Saved</Text>
        </Card>
        
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={styles.statValue}>
            {prediction?.trend === 'increasing' ? '↑' : 
             prediction?.trend === 'decreasing' ? '↓' : '→'}
          </Text>
          <Text style={styles.statLabel}>Trend</Text>
        </Card>
      </View>
      
      {/* Category breakdown if we have targets */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <Card variant="elevated" title="Found by Category" style={styles.categoryCard}>
          <View style={styles.categoryList}>
            {Object.entries(categoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([cat, size]) => (
                <View key={cat} style={styles.categoryItem}>
                  <Text style={styles.categoryName}>{cat}</Text>
                  <Text style={styles.categorySize}>{formatBytes(size)}</Text>
                </View>
              ))
            }
          </View>
        </Card>
      )}
      
      {/* Recommendations */}
      {prediction && prediction.recommendations.length > 0 && (
        <Card variant="elevated" title="Recommendations" style={styles.recsCard}>
          {prediction.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.recItem}>
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.light,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  progressCard: {
    marginBottom: SPACING.md,
  },
  progressTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
    marginBottom: SPACING.xs,
  },
  progressPath: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginBottom: SPACING.md,
  },
  progressBar: {
    marginBottom: SPACING.sm,
  },
  progressStats: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: SPACING.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  statusSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  autoModeInfo: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text.light,
  },
  successValue: {
    color: COLORS.success,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.light,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  categoryCard: {
    marginBottom: SPACING.md,
  },
  categoryList: {
    gap: SPACING.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  categoryName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.light,
    textTransform: 'capitalize',
  },
  categorySize: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  recsCard: {
    marginBottom: SPACING.md,
  },
  recItem: {
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  recText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.light,
    lineHeight: 20,
  },
});

export default DashboardScreen;
