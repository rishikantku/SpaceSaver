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

// Color constants
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
} as const;

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

// App State Interface
interface AppState {
  isScanning: boolean;
  scanProgress: number;
  scanStatus: string;
  diskUsed: number;
  diskTotal: number;
  cleanupCount: number;
  totalSaved: number;
  autoModeEnabled: boolean;
  scanResults: Array<{ category: string; size: number; count: number }>;
  scannedApps: Array<{ name: string; size: number; lastUsed: string }>;
}

// Format bytes to human readable
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Global state (simple approach without external deps)
let globalState: AppState = {
  isScanning: false,
  scanProgress: 0,
  scanStatus: '',
  diskUsed: 256.7,
  diskTotal: 512,
  cleanupCount: 0,
  totalSaved: 0,
  autoModeEnabled: false,
  scanResults: [],
  scannedApps: [],
};

let stateListeners: Array<() => void> = [];

const useAppState = () => {
  const [, forceUpdate] = useState({});
  
  React.useEffect(() => {
    const listener = () => forceUpdate({});
    stateListeners.push(listener);
    return () => {
      stateListeners = stateListeners.filter(l => l !== listener);
    };
  }, []);
  
  const setState = useCallback((updates: Partial<AppState>) => {
    globalState = { ...globalState, ...updates };
    stateListeners.forEach(l => l());
  }, []);
  
  return { state: globalState, setState };
};

// Dashboard View
const DashboardView: React.FC = () => {
  const { state, setState } = useAppState();
  const usedPercent = Math.round((state.diskUsed / state.diskTotal) * 100);

  const handleScanNow = useCallback(() => {
    console.log('Starting quick scan...');
    setState({ isScanning: true, scanProgress: 0, scanStatus: 'Starting scan...' });
    
    // Simulate scan progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        clearInterval(interval);
        setState({
          isScanning: false,
          scanProgress: 100,
          scanStatus: 'Scan complete!',
          scanResults: [
            { category: 'System Caches', size: 1.2 * 1024 * 1024 * 1024, count: 234 },
            { category: 'User Logs', size: 450 * 1024 * 1024, count: 89 },
            { category: 'Xcode Derived Data', size: 3.5 * 1024 * 1024 * 1024, count: 12 },
            { category: 'NPM Cache', size: 890 * 1024 * 1024, count: 1456 },
            { category: 'Homebrew Cache', size: 670 * 1024 * 1024, count: 45 },
          ],
        });
        Alert.alert('Scan Complete', 'Found 6.7 GB of cleanable files!');
      } else {
        setState({
          scanProgress: progress,
          scanStatus: `Scanning... ${progress}%`,
        });
      }
    }, 200);
  }, [setState]);

  return (
    <ScrollView style={viewStyles.container} showsVerticalScrollIndicator={false}>
      <Card title="Disk Overview">
        <View style={viewStyles.diskInfo}>
          <Text style={viewStyles.diskEmoji}>💾</Text>
          <Text style={viewStyles.diskUsage}>
            {state.diskUsed.toFixed(1)} GB / {state.diskTotal} GB
          </Text>
          <Text style={viewStyles.diskPercent}>{usedPercent}% used</Text>
        </View>
        <View style={viewStyles.progressBar}>
          <View style={[viewStyles.progressFill, { width: `${usedPercent}%` }]} />
        </View>
        
        {state.isScanning && (
          <View style={viewStyles.scanProgress}>
            <Text style={viewStyles.scanStatus}>{state.scanStatus}</Text>
            <View style={viewStyles.progressBar}>
              <View style={[viewStyles.progressFillBlue, { width: `${state.scanProgress}%` }]} />
            </View>
          </View>
        )}
        
        <View style={viewStyles.buttonRow}>
          <Button 
            title={state.isScanning ? "Scanning..." : "Scan Now"} 
            onPress={handleScanNow} 
          />
        </View>
      </Card>

      <Card title="Quick Stats">
        <View style={viewStyles.statsRow}>
          <View style={viewStyles.statItem}>
            <Text style={viewStyles.statEmoji}>🧹</Text>
            <Text style={viewStyles.statValue}>{state.cleanupCount}</Text>
            <Text style={viewStyles.statLabel}>Cleanups</Text>
          </View>
          <View style={viewStyles.statItem}>
            <Text style={viewStyles.statEmoji}>💾</Text>
            <Text style={viewStyles.statValue}>{formatSize(state.totalSaved)}</Text>
            <Text style={viewStyles.statLabel}>Saved</Text>
          </View>
          <View style={viewStyles.statItem}>
            <Text style={viewStyles.statEmoji}>📊</Text>
            <Text style={viewStyles.statValue}>{state.scanResults.length > 0 ? '✓' : '→'}</Text>
            <Text style={viewStyles.statLabel}>{state.scanResults.length > 0 ? 'Scanned' : 'Stable'}</Text>
          </View>
        </View>
      </Card>

      {state.scanResults.length > 0 && (
        <Card title="Scan Results">
          {state.scanResults.map((result) => (
            <View key={result.category} style={viewStyles.categoryItem}>
              <Text style={viewStyles.categoryName}>{result.category}</Text>
              <Text style={viewStyles.categorySize}>{formatSize(result.size)}</Text>
            </View>
          ))}
          <View style={[viewStyles.buttonRow, { marginTop: 16 }]}>
            <Button 
              title="Clean Selected" 
              onPress={() => {
                const totalSize = state.scanResults.reduce((sum, r) => sum + r.size, 0);
                setState({
                  cleanupCount: state.cleanupCount + 1,
                  totalSaved: state.totalSaved + totalSize,
                  scanResults: [],
                });
                Alert.alert('Cleanup Complete', `Freed ${formatSize(totalSize)} of disk space!`);
              }} 
            />
          </View>
        </Card>
      )}

      <Card title="Auto Mode">
        <View style={viewStyles.autoModeRow}>
          <View>
            <Text style={viewStyles.autoModeTitle}>Automatic Cleanup</Text>
            <Text style={viewStyles.autoModeSubtitle}>Clean junk files automatically</Text>
          </View>
          <Button
            title={state.autoModeEnabled ? "Disable" : "Enable"}
            variant="secondary"
            onPress={() => {
              setState({ autoModeEnabled: !state.autoModeEnabled });
              Alert.alert(
                'Auto Mode',
                state.autoModeEnabled ? 'Auto Mode disabled' : 'Auto Mode enabled'
              );
            }}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

// Scanner View
const ScannerView: React.FC = () => {
  const { state, setState } = useAppState();
  
  const handleFullScan = useCallback(() => {
    console.log('Starting full scan...');
    setState({ isScanning: true, scanProgress: 0, scanStatus: 'Initializing full scan...' });
    
    const categories = [
      'System Caches',
      'User Logs', 
      'Xcode Derived Data',
      'NPM Cache',
      'Homebrew Cache',
      'Browser Caches',
      'Temporary Files',
      'Old Downloads',
    ];
    
    let progress = 0;
    let currentCategory = 0;
    
    const interval = setInterval(() => {
      progress += 5;
      currentCategory = Math.min(Math.floor(progress / 12.5), categories.length - 1);
      
      if (progress >= 100) {
        clearInterval(interval);
        setState({
          isScanning: false,
          scanProgress: 100,
          scanStatus: 'Full scan complete!',
          scanResults: [
            { category: 'System Caches', size: 1.8 * 1024 * 1024 * 1024, count: 345 },
            { category: 'User Logs', size: 650 * 1024 * 1024, count: 123 },
            { category: 'Xcode Derived Data', size: 5.2 * 1024 * 1024 * 1024, count: 24 },
            { category: 'NPM Cache', size: 1.1 * 1024 * 1024 * 1024, count: 2341 },
            { category: 'Homebrew Cache', size: 890 * 1024 * 1024, count: 67 },
            { category: 'Browser Caches', size: 780 * 1024 * 1024, count: 89 },
            { category: 'Temporary Files', size: 340 * 1024 * 1024, count: 456 },
            { category: 'Old Downloads', size: 2.3 * 1024 * 1024 * 1024, count: 34 },
          ],
        });
        Alert.alert('Full Scan Complete', 'Found 13.1 GB of cleanable files!');
      } else {
        setState({
          scanProgress: progress,
          scanStatus: `Scanning ${categories[currentCategory]}... ${progress}%`,
        });
      }
    }, 150);
  }, [setState]);
  
  return (
    <ScrollView style={viewStyles.container}>
      <Card title="System Scanner">
        <Text style={viewStyles.description}>
          Scan your system for junk files, caches, and unused applications.
        </Text>
        
        {state.isScanning && (
          <View style={viewStyles.scanProgress}>
            <Text style={viewStyles.scanStatus}>{state.scanStatus}</Text>
            <View style={viewStyles.progressBar}>
              <View style={[viewStyles.progressFillBlue, { width: `${state.scanProgress}%` }]} />
            </View>
          </View>
        )}
        
        <View style={viewStyles.buttonRow}>
          <Button 
            title={state.isScanning ? "Scanning..." : "Start Full Scan"} 
            onPress={handleFullScan} 
          />
        </View>
      </Card>
      
      <Card title="Cleanup Categories">
        {state.scanResults.length > 0 ? (
          state.scanResults.map((result) => (
            <View key={result.category} style={viewStyles.categoryItem}>
              <View>
                <Text style={viewStyles.categoryName}>{result.category}</Text>
                <Text style={viewStyles.categoryCount}>{result.count} files</Text>
              </View>
              <Text style={viewStyles.categorySize}>{formatSize(result.size)}</Text>
            </View>
          ))
        ) : (
          ['System Caches', 'User Logs', 'Xcode Derived Data', 'NPM Cache', 'Homebrew Cache'].map((category) => (
            <View key={category} style={viewStyles.categoryItem}>
              <Text style={viewStyles.categoryName}>{category}</Text>
              <Text style={viewStyles.categorySize}>--</Text>
            </View>
          ))
        )}
      </Card>
      
      {state.scanResults.length > 0 && (
        <Card title="Actions">
          <View style={viewStyles.buttonRow}>
            <Button 
              title="Clean All" 
              onPress={() => {
                const totalSize = state.scanResults.reduce((sum, r) => sum + r.size, 0);
                setState({
                  cleanupCount: state.cleanupCount + 1,
                  totalSaved: state.totalSaved + totalSize,
                  scanResults: [],
                });
                Alert.alert('Cleanup Complete', `Freed ${formatSize(totalSize)} of disk space!`);
              }} 
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
};

// Apps View
const AppsView: React.FC = () => {
  const { state, setState } = useAppState();
  
  const handleScanApps = useCallback(() => {
    console.log('Scanning applications...');
    setState({ isScanning: true, scanProgress: 0, scanStatus: 'Scanning applications...' });
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress >= 100) {
        clearInterval(interval);
        setState({
          isScanning: false,
          scanProgress: 100,
          scanStatus: 'App scan complete!',
          scannedApps: [
            { name: 'Xcode', size: 12.5 * 1024 * 1024 * 1024, lastUsed: '2 days ago' },
            { name: 'Docker Desktop', size: 2.8 * 1024 * 1024 * 1024, lastUsed: '1 week ago' },
            { name: 'Visual Studio Code', size: 890 * 1024 * 1024, lastUsed: 'Today' },
            { name: 'Slack', size: 450 * 1024 * 1024, lastUsed: 'Today' },
            { name: 'Spotify', size: 380 * 1024 * 1024, lastUsed: '3 days ago' },
            { name: 'Zoom', size: 210 * 1024 * 1024, lastUsed: '1 month ago' },
          ],
        });
        Alert.alert('Scan Complete', 'Found 6 applications');
      } else {
        setState({
          scanProgress: progress,
          scanStatus: `Scanning applications... ${progress}%`,
        });
      }
    }, 150);
  }, [setState]);
  
  return (
    <ScrollView style={viewStyles.container}>
      <Card title="Application Manager">
        <Text style={viewStyles.description}>
          Manage installed applications and find unused apps to remove.
        </Text>
        
        {state.isScanning && (
          <View style={viewStyles.scanProgress}>
            <Text style={viewStyles.scanStatus}>{state.scanStatus}</Text>
            <View style={viewStyles.progressBar}>
              <View style={[viewStyles.progressFillBlue, { width: `${state.scanProgress}%` }]} />
            </View>
          </View>
        )}
        
        <View style={viewStyles.buttonRow}>
          <Button 
            title={state.isScanning ? "Scanning..." : "Scan Applications"} 
            onPress={handleScanApps} 
          />
        </View>
      </Card>
      
      {state.scannedApps.length > 0 && (
        <Card title="Installed Applications">
          {state.scannedApps.map((app) => (
            <View key={app.name} style={viewStyles.appItem}>
              <View>
                <Text style={viewStyles.appName}>{app.name}</Text>
                <Text style={viewStyles.appLastUsed}>Last used: {app.lastUsed}</Text>
              </View>
              <Text style={viewStyles.appSize}>{formatSize(app.size)}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
};

// Cloud View
const CloudView: React.FC = () => {
  const providers = [
    { name: 'iCloud Drive', storage: '5 GB Free', icon: '☁️', recommended: true },
    { name: 'Google Drive', storage: '15 GB Free', icon: '📁', recommended: true },
    { name: 'Dropbox', storage: '2 GB Free', icon: '📦', recommended: false },
    { name: 'OneDrive', storage: '5 GB Free', icon: '💼', recommended: false },
  ];
  
  return (
    <ScrollView style={viewStyles.container}>
      <Card title="Cloud Storage">
        <Text style={viewStyles.description}>
          Get recommendations for cloud storage providers based on your needs.
        </Text>
      </Card>
      <Card title="Recommended Providers">
        {providers.map((provider) => (
          <View key={provider.name} style={viewStyles.providerItem}>
            <View style={viewStyles.providerInfo}>
              <Text style={viewStyles.providerIcon}>{provider.icon}</Text>
              <View>
                <Text style={viewStyles.providerName}>{provider.name}</Text>
                <Text style={viewStyles.providerStorage}>{provider.storage}</Text>
              </View>
            </View>
            {provider.recommended && (
              <Text style={viewStyles.recommendedBadge}>Recommended</Text>
            )}
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

// Settings View
const SettingsView: React.FC = () => {
  const { state, setState } = useAppState();
  
  return (
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
          <Button
            title={state.autoModeEnabled ? "Enabled ✓" : "Disabled"}
            variant="secondary"
            onPress={() => {
              setState({ autoModeEnabled: !state.autoModeEnabled });
            }}
          />
        </View>
      </Card>
      <Card title="Statistics">
        <View style={viewStyles.settingItem}>
          <Text style={viewStyles.settingLabel}>Total Cleanups</Text>
          <Text style={viewStyles.settingValue}>{state.cleanupCount}</Text>
        </View>
        <View style={viewStyles.settingItem}>
          <Text style={viewStyles.settingLabel}>Space Saved</Text>
          <Text style={viewStyles.settingValue}>{formatSize(state.totalSaved)}</Text>
        </View>
      </Card>
      <Card title="About">
        <Text style={viewStyles.description}>SpaceSaver v1.0.0</Text>
        <Text style={viewStyles.description}>Built for macOS 15 on Apple Silicon</Text>
      </Card>
    </ScrollView>
  );
};

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
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scanProgress: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 8,
  },
  scanStatus: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  progressFillBlue: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  appItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  appLastUsed: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  appSize: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  providerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  providerStorage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recommendedBadge: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
