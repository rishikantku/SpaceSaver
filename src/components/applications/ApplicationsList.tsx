/**
 * SpaceSaver - ApplicationsList Component
 * List of installed applications with uninstall suggestions
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Card } from '../common';
import { COLORS, SPACING, FONT_SIZES, formatBytes, APP_INACTIVITY_THRESHOLDS } from '../../constants';
import { InstalledApplication, ApplicationSuggestion } from '../../types';
import { applicationService } from '../../services';

interface ApplicationsListProps {
  applications: InstalledApplication[];
  suggestions: ApplicationSuggestion[];
  onRefresh: () => void;
  isLoading: boolean;
}

interface AppItemProps {
  app: InstalledApplication;
  suggestion?: ApplicationSuggestion;
  onUninstall: (app: InstalledApplication) => void;
  onOpen: (app: InstalledApplication) => void;
}

const AppItem: React.FC<AppItemProps> = ({
  app,
  suggestion,
  onUninstall,
  onOpen,
}) => {
  const lastUsedText = useMemo(() => {
    if (!app.lastOpened) return 'Never opened';
    
    const days = Math.floor(
      (Date.now() - app.lastOpened.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (days === 0) return 'Used today';
    if (days === 1) return 'Used yesterday';
    if (days < 30) return `Used ${days} days ago`;
    if (days < 365) return `Used ${Math.floor(days / 30)} months ago`;
    return `Used ${Math.floor(days / 365)} years ago`;
  }, [app.lastOpened]);
  
  const isUnusedLong = suggestion && suggestion.lastUsedDays >= APP_INACTIVITY_THRESHOLDS.SUGGEST_UNINSTALL;
  
  return (
    <View style={[
      styles.appItem,
      isUnusedLong && styles.appItemWarning,
    ]}>
      <View style={styles.appIcon}>
        {app.icon ? (
          <Image source={{ uri: app.icon }} style={styles.iconImage} />
        ) : (
          <View style={styles.iconPlaceholder}>
            <Text style={styles.iconText}>{app.name.charAt(0)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.appInfo}>
        <View style={styles.appHeader}>
          <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
          {app.isSystemApp && (
            <View style={styles.systemBadge}>
              <Text style={styles.systemText}>System</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.appVersion}>v{app.version}</Text>
        
        <View style={styles.appMeta}>
          <Text style={styles.appSize}>{formatBytes(app.size)}</Text>
          <Text style={[
            styles.appLastUsed,
            isUnusedLong && styles.appLastUsedWarning,
          ]}>
            {lastUsedText}
          </Text>
        </View>
        
        {suggestion && (
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionText}>
              💡 {suggestion.reason}
            </Text>
            <Text style={styles.savingsText}>
              Potential savings: {formatBytes(suggestion.potentialSavings)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.appActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onOpen(app)}
        >
          <Text style={styles.actionText}>Open</Text>
        </TouchableOpacity>
        
        {!app.isSystemApp && (
          <TouchableOpacity
            style={[styles.actionButton, styles.uninstallButton]}
            onPress={() => onUninstall(app)}
          >
            <Text style={[styles.actionText, styles.uninstallText]}>
              Uninstall
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  applications,
  suggestions,
  onRefresh,
  isLoading,
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'lastUsed'>('size');
  const [showOnlySuggested, setShowOnlySuggested] = useState(false);
  
  // Create a map of suggestions by bundle ID
  const suggestionMap = useMemo(() => {
    const map = new Map<string, ApplicationSuggestion>();
    suggestions.forEach(s => map.set(s.app.bundleId, s));
    return map;
  }, [suggestions]);
  
  // Filter and sort applications
  const displayedApps = useMemo(() => {
    const apps = showOnlySuggested
      ? applications.filter(a => suggestionMap.has(a.bundleId))
      : applications;
    
    return [...apps].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.size - a.size;
        case 'lastUsed':
          if (!a.lastOpened && !b.lastOpened) return 0;
          if (!a.lastOpened) return -1;
          if (!b.lastOpened) return 1;
          return a.lastOpened.getTime() - b.lastOpened.getTime();
        default:
          return 0;
      }
    });
  }, [applications, sortBy, showOnlySuggested, suggestionMap]);
  
  const handleUninstall = (app: InstalledApplication) => {
    Alert.alert(
      `Uninstall ${app.name}?`,
      `This will remove ${app.name} and its associated data. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            const result = await applicationService.uninstallApplication(app);
            if (result.success) {
              Alert.alert('Success', result.message);
              onRefresh();
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };
  
  const handleOpen = async (app: InstalledApplication) => {
    await applicationService.openApplication(app.bundleId);
  };
  
  // Calculate stats
  const stats = useMemo(() => {
    const total = applications.reduce((sum, a) => sum + a.size, 0);
    const suggested = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);
    return { total, suggested, count: suggestions.length };
  }, [applications, suggestions]);
  
  const renderItem = ({ item }: { item: InstalledApplication }) => (
    <AppItem
      app={item}
      suggestion={suggestionMap.get(item.bundleId)}
      onUninstall={handleUninstall}
      onOpen={handleOpen}
    />
  );
  
  return (
    <View style={styles.container}>
      {/* Header stats */}
      <Card variant="elevated" style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{applications.length}</Text>
            <Text style={styles.statLabel}>Apps</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatBytes(stats.total)}</Text>
            <Text style={styles.statLabel}>Total Size</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.savingsValue]}>
              {stats.count}
            </Text>
            <Text style={styles.statLabel}>To Review</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.savingsValue]}>
              {formatBytes(stats.suggested)}
            </Text>
            <Text style={styles.statLabel}>Potential Savings</Text>
          </View>
        </View>
      </Card>
      
      {/* Filters and sorting */}
      <View style={styles.filterRow}>
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              !showOnlySuggested && styles.filterChipActive,
            ]}
            onPress={() => setShowOnlySuggested(false)}
          >
            <Text style={[
              styles.filterChipText,
              !showOnlySuggested && styles.filterChipTextActive,
            ]}>
              All Apps
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              showOnlySuggested && styles.filterChipActive,
            ]}
            onPress={() => setShowOnlySuggested(true)}
          >
            <Text style={[
              styles.filterChipText,
              showOnlySuggested && styles.filterChipTextActive,
            ]}>
              Suggested ({stats.count})
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sortGroup}>
          <Text style={styles.sortLabel}>Sort:</Text>
          {(['name', 'size', 'lastUsed'] as const).map(option => (
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
                {option === 'lastUsed' ? 'Last Used' : option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* App list */}
      <FlatList
        data={displayedApps}
        renderItem={renderItem}
        keyExtractor={item => item.bundleId}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Applications Found</Text>
            <Text style={styles.emptyText}>
              {showOnlySuggested 
                ? 'Great! No unused applications to review.'
                : 'Pull to refresh to scan for applications.'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.light,
  },
  savingsValue: {
    color: COLORS.warning,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.gray[600],
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sortGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sortLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  sortChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary + '20',
  },
  sortChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  sortChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  appItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.card.light,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  appItemWarning: {
    backgroundColor: COLORS.warning + '08',
    borderColor: COLORS.warning + '30',
  },
  appIcon: {
    marginRight: SPACING.md,
  },
  iconImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.gray[500],
  },
  appInfo: {
    flex: 1,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  appName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
    flex: 1,
  },
  systemBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
  },
  systemText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginBottom: SPACING.xs,
  },
  appMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  appSize: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  appLastUsed: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  appLastUsedWarning: {
    color: COLORS.warning,
    fontWeight: '500',
  },
  suggestionBox: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.warning + '15',
    borderRadius: 6,
  },
  suggestionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.light,
  },
  savingsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  appActions: {
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  uninstallButton: {
    backgroundColor: COLORS.danger + '15',
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  uninstallText: {
    color: COLORS.danger,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.light,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
});

export default ApplicationsList;
