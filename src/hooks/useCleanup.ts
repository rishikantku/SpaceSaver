/**
 * SpaceSaver - useCleanup Hook
 * Custom hook for cleanup operations with backup and rollback
 */

import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { cleanupService } from '../services';
import { CleanupTarget, CleanupResult, DryRunResult, BackupInfo, CleanupProgress } from '../types';

export interface UseCleanupResult {
  isCleaningUp: boolean;
  isDryRunning: boolean;
  progress: number;
  cleanupProgress: CleanupProgress | null;
  error: string | null;
  lastResult: CleanupResult | null;
  dryRunResult: DryRunResult | null;
  
  // Actions
  startCleanup: (targets?: CleanupTarget[]) => Promise<CleanupResult | null>;
  performDryRun: (targets?: CleanupTarget[]) => Promise<DryRunResult | null>;
  cancelCleanup: () => void;
  rollback: (backup: BackupInfo) => Promise<boolean>;
  cleanDocker: (olderThanDays?: number) => Promise<void>;
}

export const useCleanup = (): UseCleanupResult => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cleanupProgressState, setCleanupProgressState] = useState<CleanupProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CleanupResult | null>(null);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  
  const {
    config,
    cleanupTargets,
    setCleanupProgress,
    addCleanupResult,
    setBackups,
    addNotification,
  } = useStore();
  
  const startCleanup = useCallback(async (targets?: CleanupTarget[]): Promise<CleanupResult | null> => {
    const selectedTargets = targets || cleanupTargets.filter(t => t.selected);
    
    if (selectedTargets.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Targets Selected',
        message: 'Please select items to clean up.',
      });
      return null;
    }
    
    setIsCleaningUp(true);
    setError(null);
    setProgress(0);
    
    try {
      const result = await cleanupService.cleanup(selectedTargets, {
        createBackup: config.backupEnabled,
        verifyDeletion: true,
        mode: config.operationMode,
        onProgress: (p) => {
          setProgress(p.progress);
          setCleanupProgressState(p);
          setCleanupProgress(p);
        },
      });
      
      setLastResult(result);
      addCleanupResult(result);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Cleanup Complete',
          message: `Freed ${formatSize(result.spaceFreed)} by processing ${result.targetsProcessed} items.`,
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Cleanup Completed with Errors',
          message: `${result.errors.length} errors occurred. Check the details for more info.`,
        });
      }
      
      // Update backups list
      const backups = await cleanupService.getBackups();
      setBackups(backups);
      
      return result;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cleanup failed';
      setError(message);
      
      addNotification({
        type: 'error',
        title: 'Cleanup Failed',
        message,
      });
      
      return null;
      
    } finally {
      setIsCleaningUp(false);
      setProgress(0);
      setCleanupProgress(null);
    }
  }, [config, cleanupTargets, setCleanupProgress, addCleanupResult, setBackups, addNotification]);
  
  const performDryRun = useCallback(async (targets?: CleanupTarget[]): Promise<DryRunResult | null> => {
    const selectedTargets = targets || cleanupTargets.filter(t => t.selected);
    
    if (selectedTargets.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Targets Selected',
        message: 'Please select items for dry run.',
      });
      return null;
    }
    
    setIsDryRunning(true);
    setError(null);
    
    try {
      const result = await cleanupService.performDryRun(selectedTargets);
      setDryRunResult(result);
      
      addNotification({
        type: 'info',
        title: 'Dry Run Complete',
        message: `Would free ${formatSize(result.estimatedSpaceSaved)} from ${selectedTargets.length} items. Risk: ${result.riskAssessment.overallRisk}`,
      });
      
      return result;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Dry run failed';
      setError(message);
      
      addNotification({
        type: 'error',
        title: 'Dry Run Failed',
        message,
      });
      
      return null;
      
    } finally {
      setIsDryRunning(false);
    }
  }, [cleanupTargets, addNotification]);
  
  const cancelCleanup = useCallback(() => {
    cleanupService.cancelCleanup();
    setIsCleaningUp(false);
    setProgress(0);
    setCleanupProgressState(null);
    setCleanupProgress(null);
  }, [setCleanupProgress]);
  
  const rollback = useCallback(async (backup: BackupInfo): Promise<boolean> => {
    try {
      const result = await cleanupService.rollback(backup);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Rollback Complete',
          message: `Successfully restored ${result.filesRestored} files.`,
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Rollback Failed',
          message: result.errors.join(', '),
        });
      }
      
      return result.success;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rollback failed';
      
      addNotification({
        type: 'error',
        title: 'Rollback Failed',
        message,
      });
      
      return false;
    }
  }, [addNotification]);
  
  const cleanDocker = useCallback(async (olderThanDays = 30): Promise<void> => {
    setIsCleaningUp(true);
    setError(null);
    
    try {
      const result = await cleanupService.cleanDocker(olderThanDays);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Docker Cleanup Complete',
          message: result.details,
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Docker Cleanup',
          message: result.details,
        });
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Docker cleanup failed';
      setError(message);
      
      addNotification({
        type: 'error',
        title: 'Docker Cleanup Failed',
        message,
      });
      
    } finally {
      setIsCleaningUp(false);
    }
  }, [addNotification]);
  
  return {
    isCleaningUp,
    isDryRunning,
    progress,
    cleanupProgress: cleanupProgressState,
    error,
    lastResult,
    dryRunResult,
    startCleanup,
    performDryRun,
    cancelCleanup,
    rollback,
    cleanDocker,
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

export default useCleanup;
