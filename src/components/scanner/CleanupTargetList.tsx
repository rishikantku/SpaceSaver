/**
 * SpaceSaver - CleanupTargetList Component
 * List of files selected for cleanup
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Card, Button } from '../common';
import { COLORS, SPACING, FONT_SIZES, formatBytes } from '../../constants';
import { CleanupTarget, FileCategory } from '../../types';
import { useStore, useSelectedTargetCount, useSelectedTargetSize } from '../../store';

interface CleanupTargetListProps {
  targets: CleanupTarget[];
  onStartCleanup: () => void;
  onDryRun: () => void;
  isCleaningUp: boolean;
  isDryRunning: boolean;
}

// Category colors
const CATEGORY_COLORS: Record<FileCategory, string> = {
  cache: '#5AC8FA',
  logs: '#8E8E93',
  temp: '#FFCC00',
  downloads: '#FF9500',
  trash: '#8E8E93',
  docker: '#2496ED',
  npm: '#CB3837',
  brew: '#FBB040',
  xcode: '#147EFB',
  library: '#A855F7',
  application: '#34C759',
  media: '#FF2D55',
  documents: '#007AFF',
  other: '#636366',
};

const RISK_COLORS = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.danger,
};

interface TargetItemProps {
  target: CleanupTarget;
  onToggle: () => void;
}

const TargetItem: React.FC<TargetItemProps> = ({ target, onToggle }) => {
  return (
    <TouchableOpacity
      style={[
        styles.targetItem,
        target.selected && styles.targetItemSelected,
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.checkboxContainer}>
        <View style={[
          styles.checkbox,
          target.selected && styles.checkboxSelected,
        ]}>
          {target.selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
      
      <View style={styles.targetInfo}>
        <View style={styles.targetHeader}>
          <Text style={styles.targetName} numberOfLines={1}>
            {target.file.name}
          </Text>
          <View style={[
            styles.categoryBadge,
            { backgroundColor: CATEGORY_COLORS[target.file.category] + '20' },
          ]}>
            <Text style={[
              styles.categoryText,
              { color: CATEGORY_COLORS[target.file.category] },
            ]}>
              {target.file.category}
            </Text>
          </View>
        </View>
        
        <Text style={styles.targetPath} numberOfLines={1}>
          {target.file.path}
        </Text>
        
        <View style={styles.targetMeta}>
          <Text style={styles.targetSize}>{formatBytes(target.file.size)}</Text>
          <View style={[
            styles.riskBadge,
            { backgroundColor: RISK_COLORS[target.file.riskLevel] + '20' },
          ]}>
            <Text style={[
              styles.riskText,
              { color: RISK_COLORS[target.file.riskLevel] },
            ]}>
              {target.file.riskLevel} risk
            </Text>
          </View>
        </View>
        
        <Text style={styles.targetReason} numberOfLines={2}>
          {target.reason}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const CleanupTargetList: React.FC<CleanupTargetListProps> = ({
  targets,
  onStartCleanup,
  onDryRun,
  isCleaningUp,
  isDryRunning,
}) => {
  const [filter, setFilter] = useState<'all' | FileCategory>('all');
  const [sortBy, setSortBy] = useState<'size' | 'risk' | 'category'>('size');
  
  const {
    toggleTargetSelection,
    selectAllTargets,
    deselectAllTargets,
    selectTargetsByRisk,
  } = useStore();
  
  const selectedCount = useSelectedTargetCount();
  const selectedSize = useSelectedTargetSize();
  
  // Filter and sort targets
  const displayedTargets = useMemo(() => {
    let filtered = targets;
    
    // Apply filter
    if (filter !== 'all') {
      filtered = targets.filter(t => t.file.category === filter);
    }
    
    // Apply sort
    const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'size':
          return b.file.size - a.file.size;
        case 'risk':
          return riskOrder[a.file.riskLevel] - riskOrder[b.file.riskLevel];
        case 'category':
          return a.file.category.localeCompare(b.file.category);
        default:
          return 0;
      }
    });
  }, [targets, filter, sortBy]);
  
  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(targets.map(t => t.file.category));
    return Array.from(cats).sort();
  }, [targets]);
  
  const renderItem = ({ item }: { item: CleanupTarget }) => (
    <TargetItem
      target={item}
      onToggle={() => toggleTargetSelection(item.id)}
    />
  );
  
  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Filter buttons */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterChipText,
            filter === 'all' && styles.filterChipTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              filter === cat && styles.filterChipActive,
              { borderColor: CATEGORY_COLORS[cat] },
            ]}
            onPress={() => setFilter(cat)}
          >
            <Text style={[
              styles.filterChipText,
              { color: filter === cat ? '#FFF' : CATEGORY_COLORS[cat] },
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Selection actions */}
      <View style={styles.selectionRow}>
        <TouchableOpacity onPress={selectAllTargets}>
          <Text style={styles.selectionLink}>Select All</Text>
        </TouchableOpacity>
        <Text style={styles.selectionDivider}>|</Text>
        <TouchableOpacity onPress={deselectAllTargets}>
          <Text style={styles.selectionLink}>Clear</Text>
        </TouchableOpacity>
        <Text style={styles.selectionDivider}>|</Text>
        <TouchableOpacity onPress={() => selectTargetsByRisk('low')}>
          <Text style={[styles.selectionLink, { color: COLORS.success }]}>
            Low Risk Only
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Sort options */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {(['size', 'risk', 'category'] as const).map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.sortChip,
              sortBy === option && styles.sortChipActive,
            ]}
            onPress={() => setSortBy(option)}
          >
            <Text style={[
              styles.sortChipText,
              sortBy === option && styles.sortChipTextActive,
            ]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  return (
    <Card variant="elevated" style={styles.container} padding="none">
      <View style={styles.header}>
        <Text style={styles.title}>Cleanup Targets</Text>
        <Text style={styles.subtitle}>
          {targets.length} items found
        </Text>
      </View>
      
      <FlatList
        data={displayedTargets}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Footer with totals and actions */}
      <View style={styles.footer}>
        <View style={styles.totals}>
          <Text style={styles.totalText}>
            {selectedCount} items selected
          </Text>
          <Text style={styles.totalSize}>
            {formatBytes(selectedSize)} to free
          </Text>
        </View>
        
        <View style={styles.actions}>
          <Button
            title="Dry Run"
            variant="outline"
            size="medium"
            onPress={onDryRun}
            loading={isDryRunning}
            disabled={selectedCount === 0}
            style={styles.actionButton}
          />
          <Button
            title="Clean Now"
            variant="primary"
            size="medium"
            onPress={onStartCleanup}
            loading={isCleaningUp}
            disabled={selectedCount === 0}
            style={styles.actionButton}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.md,
  },
  listHeader: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  filterChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  selectionLink: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  selectionDivider: {
    color: COLORS.gray[300],
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sortLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  sortChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  sortChipActive: {
    backgroundColor: COLORS.primary + '20',
  },
  sortChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
  sortChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  targetItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  targetItemSelected: {
    backgroundColor: COLORS.primary + '08',
    borderColor: COLORS.primary + '30',
  },
  checkboxContainer: {
    marginRight: SPACING.md,
    paddingTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  targetInfo: {
    flex: 1,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  targetName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  targetPath: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginBottom: SPACING.xs,
  },
  targetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  targetSize: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  riskBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  targetReason: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    fontStyle: 'italic',
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totals: {},
  totalText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  totalSize: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    minWidth: 100,
  },
});

export default CleanupTargetList;
