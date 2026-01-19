/**
 * SpaceSaver - useScanner Hook
 * Custom hook for disk scanning operations
 */

import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { scannerService } from '../services';
import { CleanupRule, ScanProgress } from '../types';

export interface UseScannerResult {
  isScanning: boolean;
  progress: ScanProgress | null;
  error: string | null;
  startScan: (rules?: CleanupRule[]) => Promise<void>;
  quickScan: () => Promise<void>;
  cancelScan: () => void;
}

export const useScanner = (): UseScannerResult => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    cleanupRules,
    setScanProgress,
    setAnalyses,
    setCleanupTargets,
    setDiskInfo,
    scanProgress,
    addNotification,
  } = useStore();
  
  const startScan = useCallback(async (rules?: CleanupRule[]) => {
    setIsScanning(true);
    setError(null);
    
    try {
      const result = await scannerService.scanSystem(
        rules || cleanupRules,
        (progress) => {
          setScanProgress(progress);
        }
      );
      
      setAnalyses(result.analyses);
      setCleanupTargets(result.targets);
      setDiskInfo(result.diskInfo);
      setScanProgress(null);
      
      addNotification({
        type: 'success',
        title: 'Scan Complete',
        message: `Found ${result.targets.length} items (${formatSize(result.totalScannable)}) available for cleanup.`,
      });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      setError(message);
      
      addNotification({
        type: 'error',
        title: 'Scan Failed',
        message,
      });
      
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  }, [cleanupRules, setScanProgress, setAnalyses, setCleanupTargets, setDiskInfo, addNotification]);
  
  const quickScan = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    
    try {
      const result = await scannerService.quickScan(cleanupRules);
      
      // Quick scan doesn't set full targets, just summary
      setScanProgress({
        status: 'complete',
        filesScanned: Object.keys(result.categories).length,
        totalSize: result.estimatedSavings,
        progress: 100,
      });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Quick scan failed';
      setError(message);
    } finally {
      setIsScanning(false);
    }
  }, [cleanupRules, setScanProgress]);
  
  const cancelScan = useCallback(() => {
    scannerService.cancelScan();
    setIsScanning(false);
    setScanProgress(null);
  }, [setScanProgress]);
  
  return {
    isScanning,
    progress: scanProgress,
    error,
    startScan,
    quickScan,
    cancelScan,
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

export default useScanner;
