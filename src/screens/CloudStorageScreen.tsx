/**
 * SpaceSaver - Cloud Storage Screen
 * Compare and install cloud storage providers
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { CloudProviderCard, Card } from '../components';
import { cloudStorageService, StorageRecommendation } from '../services';
import { useStore, useSelectedTargetSize } from '../store';
import { COLORS, SPACING, FONT_SIZES, formatBytes } from '../constants';

type FilterCategory = 'all' | 'media' | 'backup' | 'documents';

export const CloudStorageScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  
  const targetSize = useSelectedTargetSize();
  const { addNotification } = useStore();
  
  // Get recommendations based on category
  const recommendations = useMemo((): StorageRecommendation[] => {
    switch (selectedCategory) {
      case 'media':
        return cloudStorageService.getBestForMedia();
      case 'backup':
        return cloudStorageService.getBestForBackups();
      case 'documents':
        return cloudStorageService.getBestForDocuments();
      default:
        return cloudStorageService.getRecommendations({
          storageNeeded: targetSize || 100 * 1024 * 1024 * 1024,
          prioritizeCost: true,
          prioritizeSecurity: false,
          prioritizeIntegration: true,
          fileTypes: ['mixed'],
          needsZeroKnowledge: false,
        });
    }
  }, [selectedCategory, targetSize]);
  
  const handleInstall = useCallback(async (providerId: string) => {
    const result = await cloudStorageService.installProvider(providerId);
    
    addNotification({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Opening Install' : 'Install Failed',
      message: result.message,
    });
  }, [addNotification]);
  
  const toggleExpand = useCallback((providerId: string) => {
    setExpandedProvider(prev => prev === providerId ? null : providerId);
  }, []);
  
  // Category filter options
  const categories: { key: FilterCategory; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '☁️' },
    { key: 'media', label: 'Media', icon: '🎬' },
    { key: 'backup', label: 'Backups', icon: '💾' },
    { key: 'documents', label: 'Documents', icon: '📄' },
  ];
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Introduction card */}
      <Card variant="elevated" style={styles.introCard}>
        <Text style={styles.introTitle}>☁️ Cloud Storage Recommendations</Text>
        <Text style={styles.introText}>
          Move your large files to the cloud to free up local disk space. 
          We analyze providers based on cost, security, and features to help you choose.
        </Text>
        
        {targetSize > 0 && (
          <View style={styles.targetSizeBox}>
            <Text style={styles.targetSizeLabel}>Based on your selected files:</Text>
            <Text style={styles.targetSizeValue}>{formatBytes(targetSize)}</Text>
          </View>
        )}
      </Card>
      
      {/* Category filter */}
      <View style={styles.filterContainer}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.filterButton,
              selectedCategory === cat.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={styles.filterIcon}>{cat.icon}</Text>
            <Text style={[
              styles.filterLabel,
              selectedCategory === cat.key && styles.filterLabelActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Quick comparison */}
      <Card variant="elevated" title="Quick Comparison" style={styles.comparisonCard}>
        <View style={styles.comparisonHeader}>
          <Text style={styles.comparisonHeaderText}>Provider</Text>
          <Text style={styles.comparisonHeaderText}>Free</Text>
          <Text style={styles.comparisonHeaderText}>Price/GB</Text>
          <Text style={styles.comparisonHeaderText}>Score</Text>
        </View>
        
        {recommendations.slice(0, 4).map(rec => (
          <View key={rec.provider.id} style={styles.comparisonRow}>
            <Text style={styles.comparisonName} numberOfLines={1}>
              {rec.provider.name}
            </Text>
            <Text style={styles.comparisonValue}>
              {rec.provider.pricing.freeStorageGB}GB
            </Text>
            <Text style={styles.comparisonValue}>
              ${rec.provider.pricing.pricePerGBMonth.toFixed(3)}
            </Text>
            <Text style={[
              styles.comparisonScore,
              { color: getScoreColor(rec.score) },
            ]}>
              {rec.score}
            </Text>
          </View>
        ))}
      </Card>
      
      {/* Provider cards */}
      <Text style={styles.sectionTitle}>Recommended Providers</Text>
      
      {recommendations.map((rec) => (
        <CloudProviderCard
          key={rec.provider.id}
          provider={rec.provider}
          recommendation={rec}
          storageNeeded={targetSize}
          onInstall={() => handleInstall(rec.provider.id)}
          expanded={expandedProvider === rec.provider.id}
          onToggleExpand={() => toggleExpand(rec.provider.id)}
        />
      ))}
      
      {/* Tips section */}
      <Card variant="outlined" style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Tips for Choosing Cloud Storage</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>
            • <Text style={styles.tipBold}>For photos & videos:</Text> iCloud or Google Photos offer good integration
          </Text>
          <Text style={styles.tipItem}>
            • <Text style={styles.tipBold}>For backups:</Text> Backblaze offers unlimited storage at a flat rate
          </Text>
          <Text style={styles.tipItem}>
            • <Text style={styles.tipBold}>For privacy:</Text> Look for zero-knowledge encryption
          </Text>
          <Text style={styles.tipItem}>
            • <Text style={styles.tipBold}>For work:</Text> Consider team features and compliance certifications
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
};

const getScoreColor = (score: number): string => {
  if (score >= 85) return COLORS.success;
  if (score >= 70) return COLORS.warning;
  return COLORS.gray[500];
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
  introCard: {
    marginBottom: SPACING.md,
  },
  introTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text.light,
    marginBottom: SPACING.sm,
  },
  introText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[600],
    lineHeight: 22,
  },
  targetSizeBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    alignItems: 'center',
  },
  targetSizeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  targetSizeValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.card.light,
    gap: SPACING.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterIcon: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  filterLabelActive: {
    color: '#FFFFFF',
  },
  comparisonCard: {
    marginBottom: SPACING.md,
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    marginBottom: SPACING.sm,
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  comparisonName: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text.light,
  },
  comparisonValue: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  comparisonScore: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.light,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  tipsCard: {
    marginTop: SPACING.md,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
    marginBottom: SPACING.md,
  },
  tipsList: {
    gap: SPACING.sm,
  },
  tipItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
    color: COLORS.text.light,
  },
});

export default CloudStorageScreen;
