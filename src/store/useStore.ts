/**
 * SpaceSaver - Zustand Store
 * Global state management for the application
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppConfig,
  DiskInfo,
  DirectoryAnalysis,
  CleanupTarget,
  CleanupResult,
  InstalledApplication,
  ApplicationSuggestion,
  SpacePrediction,
  ScanProgress,
  CleanupProgress,
  Notification,
  CleanupRule,
  OperationMode,
  BackupInfo,
} from '../types';
import { DEFAULT_CONFIG, MACOS_CLEANUP_RULES } from '../constants';

// ============================================================================
// State Interface
// ============================================================================

interface AppState {
  // Configuration
  config: AppConfig;
  
  // Disk Info
  diskInfo: DiskInfo | null;
  
  // Scanning
  scanProgress: ScanProgress | null;
  analyses: DirectoryAnalysis[];
  cleanupTargets: CleanupTarget[];
  
  // Cleanup
  cleanupProgress: CleanupProgress | null;
  cleanupHistory: CleanupResult[];
  backups: BackupInfo[];
  
  // Cleanup Rules
  cleanupRules: CleanupRule[];
  
  // Applications
  applications: InstalledApplication[];
  applicationSuggestions: ApplicationSuggestion[];
  
  // Predictions
  prediction: SpacePrediction | null;
  
  // Auto Mode
  autoModeEnabled: boolean;
  
  // Notifications
  notifications: Notification[];
  
  // UI State
  selectedTab: string;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Actions Interface
// ============================================================================

interface AppActions {
  // Configuration
  setConfig: (config: Partial<AppConfig>) => void;
  setOperationMode: (mode: OperationMode) => void;
  
  // Disk Info
  setDiskInfo: (diskInfo: DiskInfo) => void;
  
  // Scanning
  setScanProgress: (progress: ScanProgress | null) => void;
  setAnalyses: (analyses: DirectoryAnalysis[]) => void;
  setCleanupTargets: (targets: CleanupTarget[]) => void;
  toggleTargetSelection: (targetId: string) => void;
  selectAllTargets: () => void;
  deselectAllTargets: () => void;
  selectTargetsByRisk: (riskLevel: 'low' | 'medium' | 'high') => void;
  
  // Cleanup
  setCleanupProgress: (progress: CleanupProgress | null) => void;
  addCleanupResult: (result: CleanupResult) => void;
  setBackups: (backups: BackupInfo[]) => void;
  
  // Cleanup Rules
  setCleanupRules: (rules: CleanupRule[]) => void;
  toggleRule: (ruleId: string) => void;
  updateRule: (ruleId: string, updates: Partial<CleanupRule>) => void;
  
  // Applications
  setApplications: (apps: InstalledApplication[]) => void;
  setApplicationSuggestions: (suggestions: ApplicationSuggestion[]) => void;
  removeApplication: (bundleId: string) => void;
  
  // Predictions
  setPrediction: (prediction: SpacePrediction) => void;
  
  // Auto Mode
  setAutoModeEnabled: (enabled: boolean) => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  
  // UI State
  setSelectedTab: (tab: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Reset
  resetState: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: AppState = {
  config: DEFAULT_CONFIG,
  diskInfo: null,
  scanProgress: null,
  analyses: [],
  cleanupTargets: [],
  cleanupProgress: null,
  cleanupHistory: [],
  backups: [],
  cleanupRules: MACOS_CLEANUP_RULES,
  applications: [],
  applicationSuggestions: [],
  prediction: null,
  autoModeEnabled: false,
  notifications: [],
  selectedTab: 'dashboard',
  isLoading: false,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

export const useStore = create<AppState & AppActions>()(
  persist(
    (set, _get) => ({
      ...initialState,
      
      // Configuration
      setConfig: (config) =>
        set((state) => ({
          config: { ...state.config, ...config },
        })),
      
      setOperationMode: (mode) =>
        set((state) => ({
          config: { ...state.config, operationMode: mode },
        })),
      
      // Disk Info
      setDiskInfo: (diskInfo) => set({ diskInfo }),
      
      // Scanning
      setScanProgress: (scanProgress) => set({ scanProgress }),
      
      setAnalyses: (analyses) => set({ analyses }),
      
      setCleanupTargets: (cleanupTargets) => set({ cleanupTargets }),
      
      toggleTargetSelection: (targetId) =>
        set((state) => ({
          cleanupTargets: state.cleanupTargets.map((t) =>
            t.id === targetId ? { ...t, selected: !t.selected } : t
          ),
        })),
      
      selectAllTargets: () =>
        set((state) => ({
          cleanupTargets: state.cleanupTargets.map((t) => ({
            ...t,
            selected: true,
          })),
        })),
      
      deselectAllTargets: () =>
        set((state) => ({
          cleanupTargets: state.cleanupTargets.map((t) => ({
            ...t,
            selected: false,
          })),
        })),
      
      selectTargetsByRisk: (riskLevel) =>
        set((state) => ({
          cleanupTargets: state.cleanupTargets.map((t) => ({
            ...t,
            selected: t.file.riskLevel === riskLevel,
          })),
        })),
      
      // Cleanup
      setCleanupProgress: (cleanupProgress) => set({ cleanupProgress }),
      
      addCleanupResult: (result) =>
        set((state) => ({
          cleanupHistory: [result, ...state.cleanupHistory].slice(0, 50),
        })),
      
      setBackups: (backups) => set({ backups }),
      
      // Cleanup Rules
      setCleanupRules: (cleanupRules) => set({ cleanupRules }),
      
      toggleRule: (ruleId) =>
        set((state) => ({
          cleanupRules: state.cleanupRules.map((r) =>
            r.id === ruleId ? { ...r, enabled: !r.enabled } : r
          ),
        })),
      
      updateRule: (ruleId, updates) =>
        set((state) => ({
          cleanupRules: state.cleanupRules.map((r) =>
            r.id === ruleId ? { ...r, ...updates } : r
          ),
        })),
      
      // Applications
      setApplications: (applications) => set({ applications }),
      
      setApplicationSuggestions: (applicationSuggestions) =>
        set({ applicationSuggestions }),
      
      removeApplication: (bundleId) =>
        set((state) => ({
          applications: state.applications.filter(
            (a) => a.bundleId !== bundleId
          ),
          applicationSuggestions: state.applicationSuggestions.filter(
            (s) => s.app.bundleId !== bundleId
          ),
        })),
      
      // Predictions
      setPrediction: (prediction) => set({ prediction }),
      
      // Auto Mode
      setAutoModeEnabled: (autoModeEnabled) => set({ autoModeEnabled }),
      
      // Notifications
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notification-${Date.now()}-${Math.random()}`,
              timestamp: new Date(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 100),
        })),
      
      markNotificationRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      // UI State
      setSelectedTab: (selectedTab) => set({ selectedTab }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Reset
      resetState: () => set(initialState),
    }),
    {
      name: 'spacesaver-storage',
      partialize: (state) => ({
        config: state.config,
        cleanupRules: state.cleanupRules,
        cleanupHistory: state.cleanupHistory,
        autoModeEnabled: state.autoModeEnabled,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useConfig = () => useStore((state) => state.config);
export const useDiskInfo = () => useStore((state) => state.diskInfo);
export const useScanProgress = () => useStore((state) => state.scanProgress);
export const useCleanupTargets = () => useStore((state) => state.cleanupTargets);
export const useCleanupProgress = () => useStore((state) => state.cleanupProgress);
export const useApplications = () => useStore((state) => state.applications);
export const usePrediction = () => useStore((state) => state.prediction);
export const useAutoMode = () => useStore((state) => state.autoModeEnabled);
export const useNotifications = () => useStore((state) => state.notifications);

export const useSelectedTargetCount = () =>
  useStore((state) => state.cleanupTargets.filter((t) => t.selected).length);

export const useSelectedTargetSize = () =>
  useStore((state) =>
    state.cleanupTargets
      .filter((t) => t.selected)
      .reduce((sum, t) => sum + t.file.size, 0)
  );

export const useUnreadNotificationCount = () =>
  useStore((state) => state.notifications.filter((n) => !n.read).length);

export default useStore;
