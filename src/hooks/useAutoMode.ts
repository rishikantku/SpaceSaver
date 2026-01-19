/**
 * SpaceSaver - useAutoMode Hook
 * Custom hook for auto mode control
 */

import { useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { autoModeService, AutoModeConfig } from '../services';
import { AppEvent } from '../types';

export interface UseAutoModeResult {
  isEnabled: boolean;
  isRunning: boolean;
  config: AutoModeConfig;
  lastRunTime: Date | null;
  nextRunTime: Date | null;
  lastSpaceFreed: number;
  
  // Actions
  enable: () => void;
  disable: () => void;
  toggle: () => void;
  updateConfig: (updates: Partial<AutoModeConfig>) => void;
  runNow: () => Promise<void>;
}

export const useAutoMode = (): UseAutoModeResult => {
  const {
    autoModeEnabled,
    setAutoModeEnabled,
    addNotification,
    addCleanupResult,
    setCleanupProgress,
    setScanProgress,
    setCleanupTargets,
    setAnalyses,
  } = useStore();
  
  // Set up event handler
  useEffect(() => {
    const handleEvent = (event: AppEvent) => {
      switch (event.type) {
        case 'AUTO_MODE_STARTED':
          addNotification({
            type: 'info',
            title: 'Auto Mode Enabled',
            message: 'SpaceSaver will now automatically clean up unused files.',
          });
          break;
          
        case 'AUTO_MODE_STOPPED':
          addNotification({
            type: 'info',
            title: 'Auto Mode Disabled',
            message: 'Automatic cleanup has been disabled.',
          });
          break;
          
        case 'SCAN_STARTED':
          addNotification({
            type: 'info',
            title: 'Auto Scan Started',
            message: 'Scanning system for cleanup targets...',
          });
          break;
          
        case 'SCAN_PROGRESS':
          setScanProgress(event.payload);
          break;
          
        case 'SCAN_COMPLETE':
          setAnalyses(event.payload);
          setScanProgress(null);
          break;
          
        case 'CLEANUP_STARTED':
          break;
          
        case 'CLEANUP_PROGRESS':
          setCleanupProgress(event.payload);
          break;
          
        case 'CLEANUP_COMPLETE':
          addCleanupResult(event.payload);
          setCleanupProgress(null);
          addNotification({
            type: 'success',
            title: 'Auto Cleanup Complete',
            message: `Freed ${formatSize(event.payload.spaceFreed)} automatically.`,
          });
          break;
          
        case 'CLEANUP_ERROR':
          setCleanupProgress(null);
          addNotification({
            type: 'error',
            title: 'Auto Cleanup Error',
            message: event.payload,
          });
          break;
      }
    };
    
    autoModeService.setEventEmitter(handleEvent);
    
    return () => {
      autoModeService.setEventEmitter(() => {});
    };
  }, [
    addNotification,
    addCleanupResult,
    setCleanupProgress,
    setScanProgress,
    setCleanupTargets,
    setAnalyses,
  ]);
  
  const enable = useCallback(() => {
    autoModeService.start();
    setAutoModeEnabled(true);
  }, [setAutoModeEnabled]);
  
  const disable = useCallback(() => {
    autoModeService.stop();
    setAutoModeEnabled(false);
  }, [setAutoModeEnabled]);
  
  const toggle = useCallback(() => {
    if (autoModeEnabled) {
      disable();
    } else {
      enable();
    }
  }, [autoModeEnabled, enable, disable]);
  
  const updateConfig = useCallback((updates: Partial<AutoModeConfig>) => {
    autoModeService.updateConfig(updates);
  }, []);
  
  const runNow = useCallback(async () => {
    await autoModeService.runCleanup();
  }, []);
  
  const status = autoModeService.getStatus();
  
  return {
    isEnabled: autoModeEnabled,
    isRunning: status.running,
    config: autoModeService.getConfig(),
    lastRunTime: status.lastRun,
    nextRunTime: status.nextRun,
    lastSpaceFreed: status.lastSpaceFreed,
    enable,
    disable,
    toggle,
    updateConfig,
    runNow,
  };
};

// Helper function
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default useAutoMode;
