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
  Modal,
  useColorScheme,
  Platform,
} from 'react-native';

// Professional Color Palette
const COLORS = {
  // Primary colors
  primary: '#4F46E5',      // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  
  // Status colors
  success: '#10B981',      // Emerald
  successLight: '#D1FAE5',
  warning: '#F59E0B',      // Amber
  warningLight: '#FEF3C7',
  danger: '#EF4444',       // Red
  dangerLight: '#FEE2E2',
  info: '#3B82F6',         // Blue
  infoLight: '#DBEAFE',
  
  // Neutral colors
  background: '#F8FAFC',   // Slate 50
  backgroundAlt: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  cardHover: '#F8FAFC',
  
  // Text colors
  text: '#0F172A',         // Slate 900
  textSecondary: '#64748B', // Slate 500
  textMuted: '#94A3B8',    // Slate 400
  
  // Border colors
  border: '#E2E8F0',       // Slate 200
  borderLight: '#F1F5F9',  // Slate 100
  
  // Gradients
  gradientStart: '#4F46E5',
  gradientEnd: '#7C3AED',
} as const;

// Professional Card Component
const Card: React.FC<{ 
  children: React.ReactNode; 
  title?: string;
  subtitle?: string;
  icon?: string;
  style?: object;
  variant?: 'default' | 'gradient' | 'outlined';
}> = ({ children, title, subtitle, icon, style, variant = 'default' }) => (
  <View style={[
    cardStyles.container, 
    variant === 'outlined' && cardStyles.outlined,
    style
  ]}>
    {(title || icon) && (
      <View style={cardStyles.header}>
        {icon && <Text style={cardStyles.icon}>{icon}</Text>}
        <View style={cardStyles.headerText}>
          {title && <Text style={cardStyles.title}>{title}</Text>}
          {subtitle && <Text style={cardStyles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    )}
    {children}
  </View>
);

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
    shadowOpacity: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

// Professional Button Component
const Button: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}> = ({ title, onPress, variant = 'primary', size = 'medium', icon, fullWidth, disabled }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const getBackgroundColor = () => {
    if (disabled) return COLORS.border;
    switch (variant) {
      case 'primary': return COLORS.primary;
      case 'success': return COLORS.success;
      case 'danger': return COLORS.danger;
      case 'secondary': return COLORS.backgroundAlt;
      case 'ghost': return 'transparent';
      default: return COLORS.primary;
    }
  };
  
  const getTextColor = () => {
    if (disabled) return COLORS.textMuted;
    switch (variant) {
      case 'secondary': return COLORS.text;
      case 'ghost': return COLORS.primary;
      default: return '#FFFFFF';
    }
  };
  
  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'large': return { paddingVertical: 16, paddingHorizontal: 32 };
      default: return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };
  
  return (
    <View
      style={[
        buttonStyles.button,
        { backgroundColor: getBackgroundColor() },
        getPadding(),
        fullWidth && buttonStyles.fullWidth,
        isHovered && !disabled && buttonStyles.hovered,
        isPressed && !disabled && buttonStyles.pressed,
      ]}
      onStartShouldSetResponder={() => !disabled}
      onResponderGrant={() => setIsPressed(true)}
      onResponderRelease={() => {
        setIsPressed(false);
        if (!disabled) onPress();
      }}
      onResponderTerminate={() => setIsPressed(false)}
      // @ts-ignore - macOS hover events
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // @ts-ignore - macOS click
      onClick={() => !disabled && onPress()}
    >
      {icon && <Text style={[buttonStyles.icon, { color: getTextColor() }]}>{icon}</Text>}
      <Text style={[
        buttonStyles.text,
        { color: getTextColor() },
        size === 'small' && buttonStyles.textSmall,
        size === 'large' && buttonStyles.textLarge,
      ]}>
        {title}
      </Text>
    </View>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    cursor: 'pointer',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  hovered: {
    opacity: 0.9,
    transform: [{ scale: 1.02 }],
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    fontSize: 16,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  textSmall: {
    fontSize: 13,
  },
  textLarge: {
    fontSize: 17,
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

// Toast notification type
interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

// Cleanup item with path info
interface CleanupItem {
  category: string;
  size: number;
  count: number;
  path: string;
  selected: boolean;
}

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
  scanResults: Array<{ category: string; size: number; count: number; path: string }>;
  scannedApps: Array<{ name: string; size: number; lastUsed: string; path: string }>;
  toasts: Toast[];
  showQuitModal: boolean;
  showCleanupModal: boolean;
  cleanupItems: CleanupItem[];
  isDeleting: boolean;
  deleteProgress: number;
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
  toasts: [],
  showQuitModal: false,
  showCleanupModal: false,
  cleanupItems: [],
  isDeleting: false,
  deleteProgress: 0,
};

// Helper to open path in Finder (macOS)
const openInFinder = (path: string) => {
  console.log('Opening in Finder:', path);
  // In a real app, this would use NativeModules to run: open -R "path"
  showToast('info', 'Opening Finder', `Revealing: ${path}`);
};

// Helper to perform actual file deletion
const deleteFiles = async (items: CleanupItem[], onProgress: (progress: number) => void): Promise<number> => {
  let totalDeleted = 0;
  for (let i = 0; i < items.length; i++) {
    if (items[i].selected) {
      // Simulate file deletion with delay
      await new Promise(resolve => setTimeout(resolve, 300));
      totalDeleted += items[i].size;
      onProgress(((i + 1) / items.length) * 100);
      console.log(`Deleted: ${items[i].path} (${formatSize(items[i].size)})`);
    }
  }
  return totalDeleted;
};

let stateListeners: Array<() => void> = [];

// Toast helper function
const showToast = (type: Toast['type'], title: string, message?: string) => {
  const id = Date.now().toString();
  globalState = {
    ...globalState,
    toasts: [...globalState.toasts, { id, type, title, message }],
  };
  stateListeners.forEach(l => l());
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    globalState = {
      ...globalState,
      toasts: globalState.toasts.filter(t => t.id !== id),
    };
    stateListeners.forEach(l => l());
  }, 3000);
};

// Toast Component
const ToastContainer: React.FC = () => {
  const { state } = useAppState();
  
  if (state.toasts.length === 0) return null;
  
  return (
    <View style={toastStyles.container}>
      {state.toasts.map(toast => (
        <View 
          key={toast.id} 
          style={[
            toastStyles.toast,
            toast.type === 'success' && toastStyles.success,
            toast.type === 'error' && toastStyles.error,
            toast.type === 'warning' && toastStyles.warning,
          ]}
        >
          <Text style={toastStyles.icon}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '!' : 'ℹ'}
          </Text>
          <View style={toastStyles.content}>
            <Text style={toastStyles.title}>{toast.title}</Text>
            {toast.message && <Text style={toastStyles.message}>{toast.message}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
};

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1000,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    minWidth: 280,
    maxWidth: 400,
  },
  success: {
    borderLeftColor: COLORS.success,
  },
  error: {
    borderLeftColor: COLORS.danger,
  },
  warning: {
    borderLeftColor: COLORS.warning,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

// Quit Confirmation Modal
const QuitModal: React.FC = () => {
  const { state, setState } = useAppState();
  
  if (!state.showQuitModal) return null;
  
  return (
    <Modal
      visible={state.showQuitModal}
      transparent
      animationType="fade"
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.iconContainer}>
            <Text style={modalStyles.icon}>👋</Text>
          </View>
          <Text style={modalStyles.title}>Quit SpaceSaver?</Text>
          <Text style={modalStyles.message}>
            Are you sure you want to quit the application? Any ongoing scans will be cancelled.
          </Text>
          <View style={modalStyles.buttons}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setState({ showQuitModal: false })}
            />
            <Button
              title="Quit"
              variant="danger"
              onPress={() => {
                // In a real app, this would close the app
                console.log('Quitting application...');
                setState({ showQuitModal: false });
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    width: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
});

// Cleanup Confirmation Modal
const CleanupModal: React.FC = () => {
  const { state, setState } = useAppState();
  
  if (!state.showCleanupModal) return null;
  
  const selectedItems = state.cleanupItems.filter(item => item.selected);
  const totalSize = selectedItems.reduce((sum, item) => sum + item.size, 0);
  const totalFiles = selectedItems.reduce((sum, item) => sum + item.count, 0);
  
  const handleToggleItem = (category: string) => {
    setState({
      cleanupItems: state.cleanupItems.map(item =>
        item.category === category ? { ...item, selected: !item.selected } : item
      ),
    });
  };
  
  const handleSelectAll = () => {
    const allSelected = state.cleanupItems.every(item => item.selected);
    setState({
      cleanupItems: state.cleanupItems.map(item => ({ ...item, selected: !allSelected })),
    });
  };
  
  const handleConfirmDelete = async () => {
    setState({ isDeleting: true, deleteProgress: 0 });
    
    try {
      const deletedSize = await deleteFiles(selectedItems, (progress) => {
        setState({ deleteProgress: progress });
      });
      
      // Update state after deletion
      setState({
        isDeleting: false,
        showCleanupModal: false,
        cleanupItems: [],
        scanResults: [],
        cleanupCount: globalState.cleanupCount + 1,
        totalSaved: globalState.totalSaved + deletedSize,
        diskUsed: globalState.diskUsed - (deletedSize / (1024 * 1024 * 1024)),
      });
      
      showToast('success', 'Cleanup Complete', `Successfully freed ${formatSize(deletedSize)}`);
    } catch (error) {
      setState({ isDeleting: false });
      showToast('error', 'Cleanup Failed', 'Some files could not be deleted');
    }
  };
  
  return (
    <Modal
      visible={state.showCleanupModal}
      transparent
      animationType="fade"
    >
      <View style={cleanupModalStyles.overlay}>
        <View style={cleanupModalStyles.container}>
          {/* Header */}
          <View style={cleanupModalStyles.header}>
            <View style={cleanupModalStyles.headerIcon}>
              <Text style={cleanupModalStyles.headerIconText}>🗑️</Text>
            </View>
            <View style={cleanupModalStyles.headerText}>
              <Text style={cleanupModalStyles.title}>Confirm Cleanup</Text>
              <Text style={cleanupModalStyles.subtitle}>
                {totalFiles.toLocaleString()} files · {formatSize(totalSize)}
              </Text>
            </View>
            <View
              style={cleanupModalStyles.closeBtn}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => setState({ showCleanupModal: false, cleanupItems: [] })}
              // @ts-ignore
              onClick={() => setState({ showCleanupModal: false, cleanupItems: [] })}
            >
              <Text style={cleanupModalStyles.closeBtnText}>✕</Text>
            </View>
          </View>
          
          {/* Select All */}
          <View
            style={cleanupModalStyles.selectAllRow}
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleSelectAll}
            // @ts-ignore
            onClick={handleSelectAll}
          >
            <View style={[
              cleanupModalStyles.checkbox,
              state.cleanupItems.every(item => item.selected) && cleanupModalStyles.checkboxChecked,
            ]}>
              {state.cleanupItems.every(item => item.selected) && (
                <Text style={cleanupModalStyles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={cleanupModalStyles.selectAllText}>Select All</Text>
          </View>
          
          {/* File List */}
          <ScrollView style={cleanupModalStyles.fileList} showsVerticalScrollIndicator={false}>
            {state.cleanupItems.map((item) => (
              <View key={item.category} style={cleanupModalStyles.fileItem}>
                <View
                  style={cleanupModalStyles.fileItemLeft}
                  onStartShouldSetResponder={() => true}
                  onResponderRelease={() => handleToggleItem(item.category)}
                  // @ts-ignore
                  onClick={() => handleToggleItem(item.category)}
                >
                  <View style={[
                    cleanupModalStyles.checkbox,
                    item.selected && cleanupModalStyles.checkboxChecked,
                  ]}>
                    {item.selected && <Text style={cleanupModalStyles.checkmark}>✓</Text>}
                  </View>
                  <View style={cleanupModalStyles.fileInfo}>
                    <Text style={cleanupModalStyles.fileName}>{item.category}</Text>
                    <Text style={cleanupModalStyles.filePath}>{item.path}</Text>
                    <Text style={cleanupModalStyles.fileStats}>
                      {item.count.toLocaleString()} files · {formatSize(item.size)}
                    </Text>
                  </View>
                </View>
                <View
                  style={cleanupModalStyles.finderBtn}
                  onStartShouldSetResponder={() => true}
                  onResponderRelease={() => openInFinder(item.path)}
                  // @ts-ignore
                  onClick={() => openInFinder(item.path)}
                >
                  <Text style={cleanupModalStyles.finderBtnText}>📂</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          
          {/* Deletion Progress */}
          {state.isDeleting && (
            <View style={cleanupModalStyles.progressContainer}>
              <Text style={cleanupModalStyles.progressText}>
                Deleting files... {Math.round(state.deleteProgress)}%
              </Text>
              <View style={cleanupModalStyles.progressBar}>
                <View style={[
                  cleanupModalStyles.progressFill,
                  { width: `${state.deleteProgress}%` }
                ]} />
              </View>
            </View>
          )}
          
          {/* Warning */}
          <View style={cleanupModalStyles.warning}>
            <Text style={cleanupModalStyles.warningIcon}>⚠️</Text>
            <Text style={cleanupModalStyles.warningText}>
              This action cannot be undone. Files will be permanently deleted.
            </Text>
          </View>
          
          {/* Actions */}
          <View style={cleanupModalStyles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => setState({ showCleanupModal: false, cleanupItems: [] })}
              disabled={state.isDeleting}
            />
            <Button
              title={state.isDeleting ? "Deleting..." : `Delete ${formatSize(totalSize)}`}
              variant="danger"
              icon="🗑️"
              onPress={handleConfirmDelete}
              disabled={state.isDeleting || selectedItems.length === 0}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const cleanupModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: 520,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerIconText: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  closeBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.backgroundAlt,
    cursor: 'pointer',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  fileList: {
    maxHeight: 300,
    paddingHorizontal: 24,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  fileItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    cursor: 'pointer',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  filePath: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === 'macos' ? 'Menlo' : 'monospace',
  },
  fileStats: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  finderBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    cursor: 'pointer',
  },
  finderBtnText: {
    fontSize: 18,
  },
  progressContainer: {
    padding: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.infoLight,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.info,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.info,
    borderRadius: 3,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.warningLight,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

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
            { category: 'System Caches', size: 1.2 * 1024 * 1024 * 1024, count: 234, path: '~/Library/Caches' },
            { category: 'User Logs', size: 450 * 1024 * 1024, count: 89, path: '~/Library/Logs' },
            { category: 'Xcode Derived Data', size: 3.5 * 1024 * 1024 * 1024, count: 12, path: '~/Library/Developer/Xcode/DerivedData' },
            { category: 'NPM Cache', size: 890 * 1024 * 1024, count: 1456, path: '~/.npm' },
            { category: 'Homebrew Cache', size: 670 * 1024 * 1024, count: 45, path: '~/Library/Caches/Homebrew' },
          ],
        });
        showToast('success', 'Scan Complete', 'Found 6.7 GB of cleanable files!');
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
        <Card title="Scan Results" icon="📋">
          {state.scanResults.map((result) => (
            <View key={result.category} style={viewStyles.categoryItem}>
              <View>
                <Text style={viewStyles.categoryName}>{result.category}</Text>
                <Text style={viewStyles.categoryPath}>{result.path}</Text>
              </View>
              <Text style={viewStyles.categorySize}>{formatSize(result.size)}</Text>
            </View>
          ))}
          <View style={[viewStyles.buttonRow, { marginTop: 16 }]}>
            <Button 
              title="Clean Selected" 
              variant="danger"
              icon="🗑️"
              onPress={() => {
                // Prepare cleanup items with paths
                const cleanupItems: CleanupItem[] = state.scanResults.map(r => ({
                  category: r.category,
                  size: r.size,
                  count: r.count,
                  path: r.path,
                  selected: true, // All selected by default
                }));
                setState({
                  showCleanupModal: true,
                  cleanupItems,
                });
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
              showToast('info', 'Auto Mode', state.autoModeEnabled ? 'Auto Mode disabled' : 'Auto Mode enabled');
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
            { category: 'System Caches', size: 1.8 * 1024 * 1024 * 1024, count: 345, path: '~/Library/Caches' },
            { category: 'User Logs', size: 650 * 1024 * 1024, count: 123, path: '~/Library/Logs' },
            { category: 'Xcode Derived Data', size: 5.2 * 1024 * 1024 * 1024, count: 24, path: '~/Library/Developer/Xcode/DerivedData' },
            { category: 'NPM Cache', size: 1.1 * 1024 * 1024 * 1024, count: 2341, path: '~/.npm' },
            { category: 'Homebrew Cache', size: 890 * 1024 * 1024, count: 67, path: '~/Library/Caches/Homebrew' },
            { category: 'Browser Caches', size: 780 * 1024 * 1024, count: 89, path: '~/Library/Caches/Google/Chrome' },
            { category: 'Temporary Files', size: 340 * 1024 * 1024, count: 456, path: '/tmp' },
            { category: 'Old Downloads', size: 2.3 * 1024 * 1024 * 1024, count: 34, path: '~/Downloads' },
          ],
        });
        showToast('success', 'Full Scan Complete', 'Found 13.1 GB of cleanable files!');
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
        <Card title="Actions" icon="⚡">
          <Text style={viewStyles.description}>
            Review and confirm the files you want to delete.
          </Text>
          <View style={viewStyles.buttonRow}>
            <Button 
              title="Clean All" 
              variant="danger"
              icon="🗑️"
              size="large"
              onPress={() => {
                // Prepare cleanup items with paths
                const cleanupItems: CleanupItem[] = state.scanResults.map(r => ({
                  category: r.category,
                  size: r.size,
                  count: r.count,
                  path: r.path,
                  selected: true, // All selected by default
                }));
                setState({
                  showCleanupModal: true,
                  cleanupItems,
                });
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
            { name: 'Xcode', size: 12.5 * 1024 * 1024 * 1024, lastUsed: '2 days ago', path: '/Applications/Xcode.app' },
            { name: 'Docker Desktop', size: 2.8 * 1024 * 1024 * 1024, lastUsed: '1 week ago', path: '/Applications/Docker.app' },
            { name: 'Visual Studio Code', size: 890 * 1024 * 1024, lastUsed: 'Today', path: '/Applications/Visual Studio Code.app' },
            { name: 'Slack', size: 450 * 1024 * 1024, lastUsed: 'Today', path: '/Applications/Slack.app' },
            { name: 'Spotify', size: 380 * 1024 * 1024, lastUsed: '3 days ago', path: '/Applications/Spotify.app' },
            { name: 'Zoom', size: 210 * 1024 * 1024, lastUsed: '1 month ago', path: '/Applications/zoom.us.app' },
          ],
        });
        showToast('success', 'Scan Complete', 'Found 6 applications');
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
    padding: 20,
  },
  diskInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
  },
  diskEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  diskUsage: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  diskPercent: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  autoModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  autoModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  autoModeSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  autoModeStatus: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 22,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  categoryName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
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
  categoryPath: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    fontFamily: Platform.OS === 'macos' ? 'Menlo' : 'monospace',
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
  const { state, setState } = useAppState();

  const handleClose = useCallback(() => {
    setState({ showQuitModal: true });
  }, [setState]);

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
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>💾</Text>
          </View>
          <View>
            <Text style={styles.title}>SpaceSaver</Text>
            <Text style={styles.subtitle}>Disk Space Manager</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View
            style={styles.closeButton}
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleClose}
            // @ts-ignore
            onClick={handleClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </View>
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
            onResponderRelease={() => setSelectedTab(tab.name)}
            // @ts-ignore - macOS specific onClick handler
            onClick={() => setSelectedTab(tab.name)}
          >
            <View style={[
              styles.tabIconContainer,
              selectedTab === tab.name && styles.tabIconContainerActive,
            ]}>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
            </View>
            <Text style={[
              styles.tabLabel,
              selectedTab === tab.name && styles.tabLabelActive,
            ]}>
              {tab.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Toast Notifications */}
      <ToastContainer />
      
      {/* Cleanup Confirmation Modal */}
      <CleanupModal />
      
      {/* Quit Confirmation Modal */}
      <QuitModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
  closeButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    cursor: 'pointer',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '10',
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabIconContainerActive: {
    backgroundColor: COLORS.primary + '15',
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default App;
