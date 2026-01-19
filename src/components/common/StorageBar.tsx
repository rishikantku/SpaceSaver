/**
 * SpaceSaver - StorageBar Component
 * Visual representation of disk storage usage
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { formatBytes } from '../../constants';

interface StorageSegment {
  label: string;
  size: number;
  color: string;
}

interface StorageBarProps {
  totalSpace: number;
  usedSpace: number;
  segments?: StorageSegment[];
  height?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  style?: ViewStyle;
}

export const StorageBar: React.FC<StorageBarProps> = ({
  totalSpace,
  usedSpace,
  segments,
  height = 24,
  showLabels = true,
  showLegend = true,
  style,
}) => {
  const freeSpace = totalSpace - usedSpace;
  const usedPercentage = (usedSpace / totalSpace) * 100;
  
  // Calculate segment widths
  const getSegmentWidth = (size: number): number => {
    return (size / totalSpace) * 100;
  };
  
  // Determine color based on usage
  const getUsageColor = (): string => {
    if (usedPercentage > 90) return COLORS.danger;
    if (usedPercentage > 75) return COLORS.warning;
    return COLORS.primary;
  };
  
  // Default segments if none provided
  const displaySegments: StorageSegment[] = segments || [
    { label: 'Used', size: usedSpace, color: getUsageColor() },
    { label: 'Free', size: freeSpace, color: COLORS.gray[200] },
  ];
  
  return (
    <View style={[styles.container, style]}>
      {showLabels && (
        <View style={styles.labelsContainer}>
          <Text style={styles.label}>
            {formatBytes(usedSpace)} used of {formatBytes(totalSpace)}
          </Text>
          <Text style={styles.freeLabel}>
            {formatBytes(freeSpace)} free
          </Text>
        </View>
      )}
      
      <View style={[styles.barContainer, { height }]}>
        {displaySegments.map((segment, index) => (
          <View
            key={`segment-${index}`}
            style={[
              styles.segment,
              {
                width: `${getSegmentWidth(segment.size)}%` as const,
                backgroundColor: segment.color,
                borderTopLeftRadius: index === 0 ? height / 2 : 0,
                borderBottomLeftRadius: index === 0 ? height / 2 : 0,
                borderTopRightRadius: index === displaySegments.length - 1 ? height / 2 : 0,
                borderBottomRightRadius: index === displaySegments.length - 1 ? height / 2 : 0,
              },
            ]}
          />
        ))}
      </View>
      
      {showLegend && (
        <View style={styles.legendContainer}>
          {displaySegments.filter(s => s.size > 0).map((segment, index) => (
            <View key={`legend-${index}`} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: segment.color },
                ]}
              />
              <Text style={styles.legendText}>
                {segment.label} ({formatBytes(segment.size)})
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Category storage bar with multiple segments
interface CategoryStorageBarProps {
  categories: {
    name: string;
    size: number;
    color: string;
  }[];
  totalSpace: number;
  height?: number;
  style?: ViewStyle;
}

export const CategoryStorageBar: React.FC<CategoryStorageBarProps> = ({
  categories,
  totalSpace,
  height = 32,
  style,
}) => {
  const sortedCategories = [...categories].sort((a, b) => b.size - a.size);
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.barContainer, { height }]}>
        {sortedCategories.map((category, index) => {
          const width = (category.size / totalSpace) * 100;
          if (width < 0.5) return null; // Skip tiny segments
          
          return (
            <View
              key={`cat-${index}`}
              style={[
                styles.segment,
                {
                  width: `${width}%`,
                  backgroundColor: category.color,
                  borderTopLeftRadius: index === 0 ? height / 2 : 0,
                  borderBottomLeftRadius: index === 0 ? height / 2 : 0,
                },
              ]}
            />
          );
        })}
      </View>
      
      <View style={styles.categoryLegend}>
        {sortedCategories.slice(0, 6).map((category, index) => (
          <View key={`catleg-${index}`} style={styles.categoryItem}>
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: category.color },
              ]}
            />
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categorySize}>{formatBytes(category.size)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  freeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  barContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
  },
  segment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
  },
  categoryLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
  },
  categoryDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text.light,
  },
  categorySize: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
  },
});

export default StorageBar;
