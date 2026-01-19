/**
 * SpaceSaver - DiskOverview Component
 * Main dashboard overview showing disk status
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Card, StorageBar, Button } from '../common';
import { COLORS, SPACING, FONT_SIZES, formatBytes } from '../../constants';
import { useDiskInfo, usePrediction } from '../../store';

interface DiskOverviewProps {
  onScanPress: () => void;
  onCleanupPress: () => void;
  isScanning: boolean;
}

export const DiskOverview: React.FC<DiskOverviewProps> = ({
  onScanPress,
  onCleanupPress,
  isScanning,
}) => {
  const diskInfo = useDiskInfo();
  const prediction = usePrediction();
  
  if (!diskInfo) {
    return (
      <Card variant="elevated" style={styles.container}>
        <View style={styles.noData}>
          <Text style={styles.noDataTitle}>No Disk Data</Text>
          <Text style={styles.noDataText}>
            Run a scan to analyze your disk space
          </Text>
          <Button
            title="Scan Now"
            onPress={onScanPress}
            loading={isScanning}
            style={styles.scanButton}
          />
        </View>
      </Card>
    );
  }
  
  const usedPercentage = Math.round((diskInfo.usedSpace / diskInfo.totalSpace) * 100);
  const isLowSpace = usedPercentage > 80;
  const isCriticalSpace = usedPercentage > 90;
  
  return (
    <Card variant="elevated" style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Macintosh HD</Text>
          <Text style={styles.subtitle}>{diskInfo.fileSystem.toUpperCase()}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          isCriticalSpace ? styles.criticalBadge : isLowSpace ? styles.warningBadge : styles.healthyBadge,
        ]}>
          <Text style={styles.statusText}>
            {isCriticalSpace ? 'Critical' : isLowSpace ? 'Low Space' : 'Healthy'}
          </Text>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatBytes(diskInfo.totalSpace)}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isLowSpace && styles.warningText]}>
            {formatBytes(diskInfo.usedSpace)}
          </Text>
          <Text style={styles.statLabel}>Used</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.freeText]}>
            {formatBytes(diskInfo.freeSpace)}
          </Text>
          <Text style={styles.statLabel}>Free</Text>
        </View>
      </View>
      
      <StorageBar
        totalSpace={diskInfo.totalSpace}
        usedSpace={diskInfo.usedSpace}
        showLabels={false}
        showLegend={false}
        height={16}
        style={styles.storageBar}
      />
      
      <View style={styles.percentageRow}>
        <Text style={styles.percentageText}>{usedPercentage}% used</Text>
        <Text style={styles.percentageText}>{100 - usedPercentage}% free</Text>
      </View>
      
      {prediction && prediction.daysUntilFull && (
        <View style={[
          styles.predictionBox,
          prediction.daysUntilFull < 30 ? styles.predictionWarning : styles.predictionNormal,
        ]}>
          <Text style={styles.predictionTitle}>
            {prediction.daysUntilFull < 30 
              ? '⚠️ Low Space Warning'
              : '📊 Space Prediction'
            }
          </Text>
          <Text style={styles.predictionText}>
            At current usage rate, disk may be full in{' '}
            <Text style={styles.predictionHighlight}>
              {prediction.daysUntilFull} days
            </Text>
          </Text>
          {prediction.recommendations.length > 0 && (
            <Text style={styles.predictionTip}>
              {prediction.recommendations[0]}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.actions}>
        <Button
          title="Scan for Junk"
          onPress={onScanPress}
          loading={isScanning}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Quick Cleanup"
          onPress={onCleanupPress}
          style={styles.actionButton}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.light,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  healthyBadge: {
    backgroundColor: COLORS.success + '20',
  },
  warningBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  criticalBadge: {
    backgroundColor: COLORS.danger + '20',
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
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
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: COLORS.gray[200],
    alignSelf: 'center',
  },
  warningText: {
    color: COLORS.warning,
  },
  freeText: {
    color: COLORS.success,
  },
  storageBar: {
    marginBottom: SPACING.sm,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  percentageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  predictionBox: {
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  predictionNormal: {
    backgroundColor: COLORS.info + '15',
  },
  predictionWarning: {
    backgroundColor: COLORS.warning + '15',
  },
  predictionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
    marginBottom: SPACING.xs,
  },
  predictionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
  predictionHighlight: {
    fontWeight: '700',
    color: COLORS.text.light,
  },
  predictionTip: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
  },
  noData: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noDataTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.light,
    marginBottom: SPACING.sm,
  },
  noDataText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[500],
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  scanButton: {
    minWidth: 150,
  },
});

export default DiskOverview;
