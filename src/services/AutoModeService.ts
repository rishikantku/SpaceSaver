/**
 * SpaceSaver - Auto Mode Service
 * Handles automatic cleanup scheduling and execution
 */

import { CleanupRule, CleanupResult, OperationMode, AppEvent } from '../types';
import { scannerService } from './ScannerService';
import { cleanupService } from './CleanupService';
import { predictionService } from './PredictionService';
import { TIME, MACOS_CLEANUP_RULES } from '../constants';

export interface AutoModeConfig {
  enabled: boolean;
  intervalMinutes: number;
  createBackup: boolean;
  verifyDeletion: boolean;
  mode: OperationMode;
  rules: CleanupRule[];
  spaceThresholdGB: number; // Only run if free space is below this
  maxCleanupSize: number; // Maximum size to clean per run (bytes)
}

type EventEmitter = (event: AppEvent) => void;

export class AutoModeService {
  private config: AutoModeConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastRunTime: Date | null = null;
  private lastRunResult: CleanupResult | null = null;
  private eventEmitter: EventEmitter | null = null;
  
  constructor() {
    this.config = {
      enabled: false,
      intervalMinutes: 60, // Default: 1 hour
      createBackup: true,
      verifyDeletion: true,
      mode: 'normal',
      rules: MACOS_CLEANUP_RULES.filter(r => r.riskLevel === 'low'),
      spaceThresholdGB: 50, // Run when < 50GB free
      maxCleanupSize: 10 * 1024 * 1024 * 1024, // 10GB max per run
    };
  }
  
  /**
   * Set event emitter for notifications
   */
  setEventEmitter(emitter: EventEmitter): void {
    this.eventEmitter = emitter;
  }
  
  /**
   * Start auto mode
   */
  start(): void {
    if (this.intervalId) {
      return; // Already running
    }
    
    this.config.enabled = true;
    
    // Emit start event
    this.emit({ type: 'AUTO_MODE_STARTED' });
    
    // Run immediately
    this.runCleanup();
    
    // Schedule periodic runs
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.config.intervalMinutes * TIME.MINUTE);
    
    console.log(`Auto Mode started. Interval: ${this.config.intervalMinutes} minutes`);
  }
  
  /**
   * Stop auto mode
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.config.enabled = false;
    
    // Emit stop event
    this.emit({ type: 'AUTO_MODE_STOPPED' });
    
    console.log('Auto Mode stopped');
  }
  
  /**
   * Check if auto mode is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && this.intervalId !== null;
  }
  
  /**
   * Check if currently running
   */
  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Get last run time
   */
  getLastRunTime(): Date | null {
    return this.lastRunTime;
  }
  
  /**
   * Get last run result
   */
  getLastRunResult(): CleanupResult | null {
    return this.lastRunResult;
  }
  
  /**
   * Get current configuration
   */
  getConfig(): AutoModeConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AutoModeConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Restart if interval changed and already running
    if (updates.intervalMinutes && this.intervalId) {
      this.stop();
      this.start();
    }
  }
  
  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<CleanupResult | null> {
    if (this.isRunning) {
      console.log('Auto cleanup already running, skipping...');
      return null;
    }
    
    this.isRunning = true;
    this.lastRunTime = new Date();
    
    try {
      // Record usage for predictions
      await predictionService.recordUsage();
      
      // Check if cleanup is needed
      const shouldRun = await this.shouldRunCleanup();
      if (!shouldRun) {
        console.log('Cleanup conditions not met, skipping...');
        this.isRunning = false;
        return null;
      }
      
      // Scan for cleanup targets
      this.emit({ type: 'SCAN_STARTED' });
      
      const scanResult = await scannerService.scanSystem(
        this.config.rules,
        (progress) => {
          this.emit({ type: 'SCAN_PROGRESS', payload: progress });
        }
      );
      
      this.emit({ type: 'SCAN_COMPLETE', payload: scanResult.analyses });
      
      // Filter targets by risk and size
      const selectedTargets = scanResult.targets
        .filter(t => t.file.riskLevel === 'low')
        .slice(0, 100); // Limit number of targets per run
      
      // Limit total size
      let totalSize = 0;
      const limitedTargets = selectedTargets.filter(t => {
        if (totalSize + t.file.size > this.config.maxCleanupSize) {
          return false;
        }
        totalSize += t.file.size;
        t.selected = true;
        return true;
      });
      
      if (limitedTargets.length === 0) {
        console.log('No targets selected for cleanup');
        this.isRunning = false;
        return null;
      }
      
      // Perform cleanup
      this.emit({ type: 'CLEANUP_STARTED' });
      
      const result = await cleanupService.cleanup(limitedTargets, {
        createBackup: this.config.createBackup,
        verifyDeletion: this.config.verifyDeletion,
        mode: this.config.mode,
        onProgress: (progress) => {
          this.emit({ type: 'CLEANUP_PROGRESS', payload: progress });
        },
      });
      
      this.lastRunResult = result;
      
      if (result.success) {
        this.emit({ type: 'CLEANUP_COMPLETE', payload: result });
        console.log(`Auto cleanup completed. Freed: ${result.spaceFreed} bytes`);
      } else {
        this.emit({ type: 'CLEANUP_ERROR', payload: 'Cleanup completed with errors' });
      }
      
      return result;
      
    } catch (error) {
      console.error('Auto cleanup failed:', error);
      this.emit({ type: 'CLEANUP_ERROR', payload: String(error) });
      return null;
      
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Get next scheduled run time
   */
  getNextRunTime(): Date | null {
    if (!this.isEnabled() || !this.lastRunTime) {
      return null;
    }
    
    return new Date(this.lastRunTime.getTime() + this.config.intervalMinutes * TIME.MINUTE);
  }
  
  /**
   * Get status summary
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
    intervalMinutes: number;
    mode: OperationMode;
    rulesCount: number;
    lastSpaceFreed: number;
    lastErrors: number;
  } {
    return {
      enabled: this.isEnabled(),
      running: this.isRunning,
      lastRun: this.lastRunTime,
      nextRun: this.getNextRunTime(),
      intervalMinutes: this.config.intervalMinutes,
      mode: this.config.mode,
      rulesCount: this.config.rules.length,
      lastSpaceFreed: this.lastRunResult?.spaceFreed || 0,
      lastErrors: this.lastRunResult?.errors.length || 0,
    };
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private async shouldRunCleanup(): Promise<boolean> {
    const prediction = await predictionService.getPrediction();
    const diskInfo = await scannerService.scanPath('/');
    
    // Check space threshold
    const freeSpaceGB = diskInfo.totalSize > 0 
      ? (diskInfo.totalSize - diskInfo.fileCount) / (1024 * 1024 * 1024)
      : 0;
    
    if (freeSpaceGB > this.config.spaceThresholdGB) {
      console.log(`Free space (${freeSpaceGB.toFixed(1)} GB) above threshold (${this.config.spaceThresholdGB} GB)`);
      return false;
    }
    
    // Check trend - if decreasing, maybe skip
    if (prediction.trend === 'decreasing') {
      console.log('Space usage is decreasing, skipping cleanup');
      return false;
    }
    
    return true;
  }
  
  private emit(event: AppEvent): void {
    if (this.eventEmitter) {
      this.eventEmitter(event);
    }
  }
}

export const autoModeService = new AutoModeService();
export default autoModeService;
