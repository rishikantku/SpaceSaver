/**
 * SpaceSaver - App Navigator
 * Main navigation structure with tabs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  DashboardScreen,
  ScannerScreen,
  ApplicationsScreen,
  CloudStorageScreen,
  SettingsScreen,
} from '../screens';
import { useStore, useUnreadNotificationCount } from '../store';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

type TabName = 'dashboard' | 'scanner' | 'applications' | 'cloud' | 'settings';

interface TabConfig {
  name: TabName;
  label: string;
  icon: string;
  component: React.FC;
}

const tabs: TabConfig[] = [
  { name: 'dashboard', label: 'Dashboard', icon: '📊', component: DashboardScreen },
  { name: 'scanner', label: 'Scanner', icon: '🔍', component: ScannerScreen },
  { name: 'applications', label: 'Apps', icon: '📱', component: ApplicationsScreen },
  { name: 'cloud', label: 'Cloud', icon: '☁️', component: CloudStorageScreen },
  { name: 'settings', label: 'Settings', icon: '⚙️', component: SettingsScreen },
];

export const AppNavigator: React.FC = () => {
  const { selectedTab, setSelectedTab } = useStore();
  const unreadCount = useUnreadNotificationCount();
  
  const currentTab = tabs.find(t => t.name === selectedTab) || tabs[0];
  const CurrentScreen = currentTab.component;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.logo}>💾</Text>
          <Text style={styles.title}>SpaceSaver</Text>
        </View>
        
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Main content */}
      <View style={styles.content}>
        <CurrentScreen />
      </View>
      
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              selectedTab === tab.name && styles.tabActive,
            ]}
            onPress={() => setSelectedTab(tab.name)}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              selectedTab === tab.name && styles.tabLabelActive,
            ]}>
              {tab.label}
            </Text>
            {selectedTab === tab.name && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card.light,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logo: {
    fontSize: 24,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text.light,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  notificationBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card.light,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    position: 'relative',
  },
  tabActive: {
    // Active tab styles handled by indicator
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 40,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});

export default AppNavigator;
