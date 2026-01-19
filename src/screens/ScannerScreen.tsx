/**
 * SpaceSaver - Scanner Screen
 * Full system scan and cleanup management
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { CleanupTargetList, Card, Button, ProgressBar } from '../components';
import { useScanner, useCleanup } from '../hooks';
import { useStore, useCleanupTargets, useSelectedTargetCount, useSelectedTargetSize } from '../store';
import { COLORS, SPACING, FONT_SIZES, formatBytes } from '../constants';

export const ScannerScreen: React.FC = () => {
  const [showDryRunResults, setShowDryRunResults] = useState(false);
  
  const { isScanning, progress, startScan, cancelScan } = useScanner();
  const {
    isCleaningUp,
    isDryRunning,
    cleanupProgress,
    dryRunResult,
    startCleanup,
    performDryRun,
    cancelCleanup,
  } = useCleanup();
  
  const { cleanupRules, config } = useStore();
  const cleanupTargets = useCleanupTargets();
  const selectedCount = useSelectedTargetCount();
  const selectedSize = useSelectedTargetSize();
  
  const handleScan = useCallback(async () => {
    await startScan(cleanupRules);
  }, [startScan, cleanupRules]);
  
  const handleCleanup = useCallback(async () => {
    if (config.operationMode === 'dryRun') {
      Alert.alert(
        'Dry Run Mode',
        'You are in Dry Run mode. Files will not be deleted. Switch to Normal mode in Settings to perform actual cleanup.',
        [{ text: 'OK' }]
      );
      await performDryRun();
      setShowDryRunResults(true);
      return;
    }
    
    Alert.alert(
      'Confirm Cleanup',
      `This will delete ${selectedCount} items (${formatBytes(selectedSize)}). ${config.backupEnabled ? 'A backup will be created first.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean',
          style: 'destructive',
          onPress: async () => {
            await startCleanup();
          },
        },
      ]
    );
  }, [config, selectedCount, selectedSize, startCleanup, performDryRun]);
  
  const handleDryRun = useCallback(async () => {
    await performDryRun();
    setShowDryRunResults(true);
  }, [performDryRun]);
  
  // Empty state - no scan run yet
  if (cleanupTargets.length === 0 && !isScanning) {
    return (
      <View style={styles.emptyContainer}>
        <Card variant="elevated" style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>Ready to Scan</Text>
          <Text style={styles.emptyText}>
            Scan your system to find files that can be safely removed to free up disk space.
          </Text>
          <Button
            title="Start Full Scan"
            onPress={handleScan}
            loading={isScanning}
            style={styles.scanButton}
          />
          <Text style={styles.modeIndicator}>
            Mode: {config.operationMode === 'dryRun' ? '🧪 Dry Run' : '⚡ Normal'}
          </Text>
        </Card>
      </View>
    );
  }
  
  // Scanning in progress
  if (isScanning && progress) {
    return (
      <View style={styles.scanningContainer}>
        <Card variant="elevated" style={styles.scanningCard}>
          <Text style={styles.scanningEmoji}>⏳</Text>
          <Text style={styles.scanningTitle}>Scanning System...</Text>
          <Text style={styles.scanningPath} numberOfLines={2}>
            {progress.currentPath || 'Preparing scan...'}
          </Text>
          
          <ProgressBar
            progress={progress.progress}
            showPercentage
            height={10}
            style={styles.progressBar}
          />
          
          <View style={styles.scanStats}>
            <View style={styles.scanStat}>
              <Text style={styles.scanStatValue}>{progress.filesScanned}</Text>
              <Text style={styles.scanStatLabel}>Files Scanned</Text>
            </View>
            <View style={styles.scanStat}>
              <Text style={styles.scanStatValue}>
                {formatBytes(progress.totalSize)}
              </Text>
              <Text style={styles.scanStatLabel}>Found</Text>
            </View>
          </View>
          
          <Button
            title="Cancel Scan"
            variant="outline"
            onPress={cancelScan}
            style={styles.cancelButton}
          />
        </Card>
      </View>
    );
  }
  
  // Cleanup in progress
  if (isCleaningUp && cleanupProgress) {
    return (
      <View style={styles.scanningContainer}>
        <Card variant="elevated" style={styles.scanningCard}>
          <Text style={styles.scanningEmoji}>
            {cleanupProgress.status === 'backing_up' ? '💾' :
             cleanupProgress.status === 'cleaning' ? '🧹' :
             cleanupProgress.status === 'verifying' ? '✅' : '⏳'}
          </Text>
          <Text style={styles.scanningTitle}>
            {cleanupProgress.status === 'backing_up' ? 'Creating Backup...' :
             cleanupProgress.status === 'cleaning' ? 'Cleaning Files...' :
             cleanupProgress.status === 'verifying' ? 'Verifying...' :
             'Processing...'}
          </Text>
          <Text style={styles.scanningPath} numberOfLines={2}>
            {cleanupProgress.currentFile || 'Preparing...'}
          </Text>
          
          <ProgressBar
            progress={cleanupProgress.progress}
            showPercentage
            height={10}
            color={COLORS.success}
            style={styles.progressBar}
          />
          
          <View style={styles.scanStats}>
            <View style={styles.scanStat}>
              <Text style={styles.scanStatValue}>
                {cleanupProgress.filesProcessed} / {cleanupProgress.totalFiles}
              </Text>
              <Text style={styles.scanStatLabel}>Files Processed</Text>
            </View>
            <View style={styles.scanStat}>
              <Text style={[styles.scanStatValue, styles.successValue]}>
                {formatBytes(cleanupProgress.spaceFreed)}
              </Text>
              <Text style={styles.scanStatLabel}>Freed</Text>
            </View>
          </View>
          
          <Button
            title="Cancel"
            variant="danger"
            onPress={cancelCleanup}
            style={styles.cancelButton}
          />
        </Card>
      </View>
    );
  }
  
  // Show dry run results
  if (showDryRunResults && dryRunResult) {
    return (
      <View style={styles.container}>
        <Card variant="elevated" style={styles.dryRunCard}>
          <Text style={styles.dryRunEmoji}>🧪</Text>
          <Text style={styles.dryRunTitle}>Dry Run Complete</Text>
          
          <View style={styles.dryRunStats}>
            <View style={styles.dryRunStat}>
              <Text style={styles.dryRunStatValue}>
                {dryRunResult.targets.length}
              </Text>
              <Text style={styles.dryRunStatLabel}>Items Selected</Text>
            </View>
            <View style={styles.dryRunStat}>
              <Text style={[styles.dryRunStatValue, styles.successValue]}>
                {formatBytes(dryRunResult.estimatedSpaceSaved)}
              </Text>
              <Text style={styles.dryRunStatLabel}>Would Free</Text>
            </View>
          </View>
          
          <View style={[
            styles.riskBox,
            { backgroundColor: getRiskColor(dryRunResult.riskAssessment.overallRisk) + '15' },
          ]}>
            <Text style={styles.riskTitle}>Risk Assessment</Text>
            <Text style={[
              styles.riskLevel,
              { color: getRiskColor(dryRunResult.riskAssessment.overallRisk) },
            ]}>
              {dryRunResult.riskAssessment.overallRisk.toUpperCase()}
            </Text>
            <View style={styles.riskCounts}>
              <Text style={styles.riskCount}>
                🟢 {dryRunResult.riskAssessment.lowRiskCount} Low
              </Text>
              <Text style={styles.riskCount}>
                🟡 {dryRunResult.riskAssessment.mediumRiskCount} Medium
              </Text>
              <Text style={styles.riskCount}>
                🔴 {dryRunResult.riskAssessment.highRiskCount} High
              </Text>
            </View>
            {dryRunResult.riskAssessment.warnings.map((warning, idx) => (
              <Text key={idx} style={styles.riskWarning}>
                ⚠️ {warning}
              </Text>
            ))}
          </View>
          
          {dryRunResult.simulation.success && (
            <Text style={styles.simulationSuccess}>
              ✅ Test simulation passed successfully
            </Text>
          )}
          
          <View style={styles.dryRunActions}>
            <Button
              title="Back to Targets"
              variant="outline"
              onPress={() => setShowDryRunResults(false)}
              style={styles.dryRunButton}
            />
            <Button
              title="Proceed to Cleanup"
              variant="primary"
              onPress={() => {
                setShowDryRunResults(false);
                // Switch to normal mode and cleanup
              }}
              style={styles.dryRunButton}
            />
          </View>
        </Card>
      </View>
    );
  }
  
  // Main cleanup target list
  return (
    <View style={styles.container}>
      <CleanupTargetList
        targets={cleanupTargets}
        onStartCleanup={handleCleanup}
        onDryRun={handleDryRun}
        isCleaningUp={isCleaningUp}
        isDryRunning={isDryRunning}
      />
    </View>
  );
};

const getRiskColor = (risk: string): string => {
  switch (risk) {
    case 'low': return COLORS.success;
    case 'medium': return COLORS.warning;
    case 'high': return COLORS.danger;
    default: return COLORS.gray[500];
  }
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
  scanButton: {
    minWidth: 200,
    marginBottom: SPACING.md,
  },
  modeIndicator: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background.light,
  },
  scanningCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  scanningEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  scanningTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.light,
    marginBottom: SPACING.sm,
  },
  scanningPath: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.lg,
    minHeight: 40,
  },
  progressBar: {
    marginBottom: SPACING.lg,
    width: '100%',
  },
  scanStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  scanStat: {
    alignItems: 'center',
  },
  scanStatValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.light,
  },
  scanStatLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  successValue: {
    color: COLORS.success,
  },
  cancelButton: {
    minWidth: 150,
  },
  dryRunCard: {
    margin: SPACING.md,
    alignItems: 'center',
    padding: SPACING.lg,
  },
  dryRunEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  dryRunTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.light,
    marginBottom: SPACING.lg,
  },
  dryRunStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  dryRunStat: {
    alignItems: 'center',
  },
  dryRunStatValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text.light,
  },
  dryRunStatLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  riskBox: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  riskTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginBottom: SPACING.xs,
  },
  riskLevel: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  riskCounts: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  riskCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
  riskWarning: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    marginTop: SPACING.xs,
  },
  simulationSuccess: {
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
    marginBottom: SPACING.lg,
  },
  dryRunActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dryRunButton: {
    flex: 1,
  },
});

export default ScannerScreen;
