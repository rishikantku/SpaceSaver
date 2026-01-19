/**
 * SpaceSaver - Main Application Entry
 * 
 * A comprehensive disk space management application for macOS
 * Built with React Native for Apple Silicon M2
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';

// Inline simple components to avoid import issues
const COLORS = {
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  background: '#F5F5F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E5E5E7',
};

// Simple Card Component
const Card: React.FC<{ 
  children: React.ReactNode; 
  title?: string;
  style?: object;
}> = ({ children, title, style }) => (
  <View style={[cardStyles.container, style]}>
    {title && <Text style={cardStyles.title}>{title}</Text>}
    {children}
  </View>
);

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.text,
  },
});

// Simple Button Component - Using View with responder for macOS compatibility
const Button: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}> = ({ title, onPress, variant = 'primary' }) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePress = useCallback(() => {
    console.log('Button pressed:', title);
    Alert.alert('Button Pressed', `You pressed: ${title}`);
    onPress();
  }, [title, onPress]);
  
  return (
    <View
      style={[
        buttonStyles.button,
        variant === 'secondary' && buttonStyles.secondary,
        isPressed && buttonStyles.pressed,
      ]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => {
        console.log('Responder granted for button:', title);
        setIsPressed(true);
      }}
      onResponderRelease={() => {
        console.log('Responder released for button:', title);
        setIsPressed(false);
        handlePress();
      }}
      onResponderTerminate={() => setIsPressed(false)}
      // @ts-ignore - macOS specific
      onClick={handlePress}
    >
      <Text style={[
        buttonStyles.text,
        variant === 'secondary' && buttonStyles.secondaryText,
      ]}>
        {title}
      </Text>
    </View>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    cursor: 'pointer',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  hovered: {
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.98 }],
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: COLORS.primary,
  },
});

// Tab definitions
type TabName = 'dashboard' | 'scanner' | 'apps' | 'cloud' | 'settings';

interface Tab {
  name: TabName;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { name: 'dashboard', label: 'Dashboard', icon: '📊' },
  { name: 'scanner', label: 'Scanner', icon: '🔍' },
  { name: 'apps', label: 'Apps', icon: '📱' },
  { name: 'cloud', label: 'Cloud', icon: '☁️' },
  { name: 'settings', label: 'Settings', icon: '⚙️' },
];

// Dashboard View
const DashboardView: React.FC = () => {
  const [diskUsed] = useState(256.7);
  const [diskTotal] = useState(512);
  const usedPercent = Math.round((diskUsed / diskTotal) * 100);

  return (
    <ScrollView style={viewStyles.container} showsVerticalScrollIndicator={false}>
      <Card title="Disk Overview">
        <View style={viewStyles.diskInfo}>
          <Text style={viewStyles.diskEmoji}>💾</Text>
          <Text style={viewStyles.diskUsage}>
            {diskUsed.toFixed(1)} GB / {diskTotal} GB
          </Text>
          <Text style={viewStyles.diskPercent}>{usedPercent}% used</Text>
        </View>
        <View style={viewStyles.progressBar}>
          <View style={[viewStyles.progressFill, { width: `${usedPercent}%` }]} />
        </View>
        <View style={viewStyles.buttonRow}>
          <Button title="Scan Now" onPress={() => console.log('Scan')} />
        </View>
      </Card>

      <Card title="Quick Stats">
        <View style={viewStyles.statsRow}>
          <View style={viewStyles.statItem}>
            <Text style={viewStyles.statEmoji}>🧹</Text>
            <Text style={viewStyles.statValue}>3</Text>
            <Text style={viewStyles.statLabel}>Cleanups</Text>
          </View>
          <View style={viewStyles.statItem}>
            <Text style={viewStyles.statEmoji}>💾</Text>
            <Text style={viewStyles.statValue}>4.2 GB</Text>
            <Text style={viewStyles.statLabel}>Saved</Text>
          </View>
          <View style={viewStyles.statItem}>
            <Text style={viewStyles.statEmoji}>📊</Text>
            <Text style={viewStyles.statValue}>→</Text>
            <Text style={viewStyles.statLabel}>Stable</Text>
          </View>
        </View>
      </Card>

      <Card title="Auto Mode">
        <View style={viewStyles.autoModeRow}>
          <View>
            <Text style={viewStyles.autoModeTitle}>Automatic Cleanup</Text>
            <Text style={viewStyles.autoModeSubtitle}>Clean junk files automatically</Text>
          </View>
          <Text style={viewStyles.autoModeStatus}>Disabled</Text>
        </View>
      </Card>
    </ScrollView>
  );
};

// Scanner View
const ScannerView: React.FC = () => (
  <ScrollView style={viewStyles.container}>
    <Card title="System Scanner">
      <Text style={viewStyles.description}>
        Scan your system for junk files, caches, and unused applications.
      </Text>
      <View style={viewStyles.buttonRow}>
        <Button title="Start Full Scan" onPress={() => console.log('Full Scan')} />
      </View>
    </Card>
    <Card title="Cleanup Categories">
      {['System Caches', 'User Logs', 'Xcode Derived Data', 'NPM Cache', 'Homebrew Cache'].map((category) => (
        <View key={category} style={viewStyles.categoryItem}>
          <Text style={viewStyles.categoryName}>{category}</Text>
          <Text style={viewStyles.categorySize}>--</Text>
        </View>
      ))}
    </Card>
  </ScrollView>
);

// Apps View
const AppsView: React.FC = () => (
  <ScrollView style={viewStyles.container}>
    <Card title="Application Manager">
      <Text style={viewStyles.description}>
        Manage installed applications and find unused apps to remove.
      </Text>
      <View style={viewStyles.buttonRow}>
        <Button title="Scan Applications" onPress={() => console.log('Scan Apps')} />
      </View>
    </Card>
  </ScrollView>
);

// Cloud View
const CloudView: React.FC = () => (
  <ScrollView style={viewStyles.container}>
    <Card title="Cloud Storage">
      <Text style={viewStyles.description}>
        Get recommendations for cloud storage providers based on your needs.
      </Text>
    </Card>
    <Card title="Recommended Providers">
      {['iCloud Drive', 'Google Drive', 'Dropbox', 'OneDrive'].map((provider) => (
        <View key={provider} style={viewStyles.providerItem}>
          <Text style={viewStyles.providerName}>{provider}</Text>
        </View>
      ))}
    </Card>
  </ScrollView>
);

// Settings View
const SettingsView: React.FC = () => (
  <ScrollView style={viewStyles.container}>
    <Card title="Settings">
      <View style={viewStyles.settingItem}>
        <Text style={viewStyles.settingLabel}>Theme</Text>
        <Text style={viewStyles.settingValue}>System</Text>
      </View>
      <View style={viewStyles.settingItem}>
        <Text style={viewStyles.settingLabel}>Notifications</Text>
        <Text style={viewStyles.settingValue}>Enabled</Text>
      </View>
      <View style={viewStyles.settingItem}>
        <Text style={viewStyles.settingLabel}>Auto Mode</Text>
        <Text style={viewStyles.settingValue}>Disabled</Text>
      </View>
    </Card>
    <Card title="About">
      <Text style={viewStyles.description}>SpaceSaver v1.0.0</Text>
      <Text style={viewStyles.description}>Built for macOS 15 on Apple Silicon</Text>
    </Card>
  </ScrollView>
);

const viewStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  diskInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  diskEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  diskUsage: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  diskPercent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  autoModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  autoModeSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  autoModeStatus: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.text,
  },
  categorySize: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  providerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  providerName: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  settingValue: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

// Main App Component
const App: React.FC = () => {
  const colorScheme = useColorScheme();
  const [selectedTab, setSelectedTab] = useState<TabName>('dashboard');

  const renderContent = () => {
    switch (selectedTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'scanner':
        return <ScannerView />;
      case 'apps':
        return <AppsView />;
      case 'cloud':
        return <CloudView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.logo}>💾</Text>
          <Text style={styles.title}>SpaceSaver</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <View
            key={tab.name}
            style={[
              styles.tab,
              selectedTab === tab.name && styles.tabActive,
            ]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => {
              console.log('Tab selected:', tab.name);
              setSelectedTab(tab.name);
            }}
            // @ts-ignore - macOS specific onClick handler
            onClick={() => {
              console.log('Tab clicked:', tab.name);
              setSelectedTab(tab.name);
            }}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              selectedTab === tab.name && styles.tabLabelActive,
            ]}>
              {tab.label}
            </Text>
            {selectedTab === tab.name && <View style={styles.tabIndicator} />}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative',
    cursor: 'pointer',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
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

export default App;
