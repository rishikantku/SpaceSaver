/**
 * SpaceSaver - Cleanup Service
 * Handles file cleanup with backup, verification, and rollback capabilities
 */

import { getCurrentPlatformService, IPlatformService } from '../platform';
import {
  CleanupTarget,
  CleanupResult,
  CleanupProgress,
  CleanupError,
  BackupInfo,
  RollbackResult,
  OperationMode,
  DryRunResult,
  DryRunSimulation,
  RiskAssessment,
} from '../types';
import { formatBytes } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export type CleanupProgressCallback = (progress: CleanupProgress) => void;

export interface CleanupOptions {
  createBackup: boolean;
  verifyDeletion: boolean;
  mode: OperationMode;
  onProgress?: CleanupProgressCallback;
}

export class CleanupService {
  private platformService: IPlatformService;
  private abortController: AbortController | null = null;
  private currentBackup: BackupInfo | null = null;
  
  constructor() {
    this.platformService = getCurrentPlatformService();
  }
  
  /**
   * Perform cleanup operation with optional backup and verification
   */
  async cleanup(
    targets: CleanupTarget[],
    options: CleanupOptions
  ): Promise<CleanupResult> {
    this.abortController = new AbortController();
    const startTime = new Date();
    const selectedTargets = targets.filter(t => t.selected);
    
    const progress: CleanupProgress = {
      status: 'preparing',
      filesProcessed: 0,
      totalFiles: selectedTargets.length,
      spaceFreed: 0,
      progress: 0,
    };
    
    const errors: CleanupError[] = [];
    let spaceFreed = 0;
    let backupId: string | undefined;
    
    options.onProgress?.(progress);
    
    // If dry run mode, simulate cleanup
    if (options.mode === 'dryRun') {
      return this.performDryRunCleanup(selectedTargets, options);
    }
    
    try {
      // Step 1: Create backup if enabled
      if (options.createBackup) {
        progress.status = 'backing_up';
        options.onProgress?.(progress);
        
        const filesToBackup = selectedTargets.map(t => t.file.path);
        this.currentBackup = await this.platformService.createBackup(filesToBackup);
        backupId = this.currentBackup.id;
        
        console.log(`Backup created: ${this.currentBackup.id} (${formatBytes(this.currentBackup.totalSize)})`);
      }
      
      // Step 2: Perform cleanup
      progress.status = 'cleaning';
      options.onProgress?.(progress);
      
      for (let i = 0; i < selectedTargets.length; i++) {
        if (this.abortController.signal.aborted) {
          throw new Error('Cleanup aborted by user');
        }
        
        const target = selectedTargets[i];
        progress.currentFile = target.file.path;
        progress.filesProcessed = i;
        progress.progress = Math.round((i / selectedTargets.length) * 90);
        options.onProgress?.(progress);
        
        try {
          let deleted = false;
          
          if (target.file.isDirectory) {
            deleted = await this.platformService.deleteDirectory(target.file.path, true);
          } else {
            deleted = await this.platformService.deleteFile(target.file.path);
          }
          
          if (deleted) {
            spaceFreed += target.file.size;
          } else {
            errors.push({
              targetId: target.id,
              path: target.file.path,
              error: 'Failed to delete file',
              recoverable: options.createBackup,
            });
          }
        } catch (error) {
          errors.push({
            targetId: target.id,
            path: target.file.path,
            error: String(error),
            recoverable: options.createBackup,
          });
        }
      }
      
      // Step 3: Verify deletion if enabled
      if (options.verifyDeletion) {
        progress.status = 'verifying';
        progress.progress = 95;
        options.onProgress?.(progress);
        
        for (const target of selectedTargets) {
          const stillExists = await this.platformService.fileExists(target.file.path);
          
          if (stillExists && !errors.find(e => e.targetId === target.id)) {
            errors.push({
              targetId: target.id,
              path: target.file.path,
              error: 'File still exists after deletion',
              recoverable: options.createBackup,
            });
          }
        }
      }
      
      // If too many errors, rollback
      if (errors.length > selectedTargets.length * 0.3 && options.createBackup && this.currentBackup) {
        console.warn('Too many errors, initiating rollback...');
        
        progress.status = 'rolling_back';
        options.onProgress?.(progress);
        
        const rollbackResult = await this.rollback(this.currentBackup);
        
        if (!rollbackResult.success) {
          console.error('Rollback failed:', rollbackResult.errors);
        }
        
        throw new Error('Cleanup failed with too many errors, rollback performed');
      }
      
      // Step 4: Delete backup if everything succeeded
      if (options.createBackup && this.currentBackup && errors.length === 0) {
        await this.platformService.deleteBackup(this.currentBackup.id);
        console.log('Backup deleted after successful cleanup');
      }
      
      progress.status = 'complete';
      progress.progress = 100;
      progress.spaceFreed = spaceFreed;
      options.onProgress?.(progress);
      
      return {
        id: uuidv4(),
        startTime,
        endTime: new Date(),
        targetsProcessed: selectedTargets.length,
        spaceFreed,
        success: errors.length === 0,
        errors,
        backupId,
      };
      
    } catch (error) {
      progress.status = 'error';
      options.onProgress?.(progress);
      
      // Attempt rollback on error
      if (this.currentBackup) {
        await this.rollback(this.currentBackup);
      }
      
      return {
        id: uuidv4(),
        startTime,
        endTime: new Date(),
        targetsProcessed: 0,
        spaceFreed: 0,
        success: false,
        errors: [{
          targetId: '',
          path: '',
          error: String(error),
          recoverable: false,
        }],
        backupId,
      };
    }
  }
  
  /**
   * Perform dry run cleanup - simulates cleanup without affecting real files
   */
  async performDryRun(targets: CleanupTarget[]): Promise<DryRunResult> {
    const selectedTargets = targets.filter(t => t.selected);
    const simulation = await this.simulateCleanup(selectedTargets);
    
    return {
      id: uuidv4(),
      timestamp: new Date(),
      targets: selectedTargets,
      estimatedSpaceSaved: selectedTargets.reduce((sum, t) => sum + t.file.size, 0),
      estimatedDuration: selectedTargets.length * 0.1, // Rough estimate
      riskAssessment: this.assessRisk(selectedTargets),
      simulation,
    };
  }
  
  /**
   * Rollback to backup
   */
  async rollback(backup: BackupInfo): Promise<RollbackResult> {
    return await this.platformService.restoreBackup(backup);
  }
  
  /**
   * Cancel ongoing cleanup
   */
  cancelCleanup(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
  
  /**
   * Get list of available backups
   */
  async getBackups(): Promise<BackupInfo[]> {
    return await this.platformService.listBackups();
  }
  
  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    return await this.platformService.deleteBackup(backupId);
  }
  
  /**
   * Clean Docker resources
   */
  async cleanDocker(olderThanDays: number = 30): Promise<{
    success: boolean;
    spaceFreed: number;
    details: string;
  }> {
    if (!(await this.platformService.isDockerInstalled())) {
      return {
        success: false,
        spaceFreed: 0,
        details: 'Docker is not installed',
      };
    }
    
    const result = await this.platformService.pruneDockerImages(olderThanDays);
    
    return {
      success: result.success,
      spaceFreed: result.spaceReclaimed,
      details: `Removed ${result.imagesRemoved} images, freed ${formatBytes(result.spaceReclaimed)}`,
    };
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private async performDryRunCleanup(
    targets: CleanupTarget[],
    options: CleanupOptions
  ): Promise<CleanupResult> {
    const startTime = new Date();
    
    const progress: CleanupProgress = {
      status: 'preparing',
      filesProcessed: 0,
      totalFiles: targets.length,
      spaceFreed: 0,
      progress: 0,
    };
    
    // Simulate processing
    for (let i = 0; i < targets.length; i++) {
      progress.currentFile = `[DRY RUN] ${targets[i].file.path}`;
      progress.filesProcessed = i;
      progress.progress = Math.round((i / targets.length) * 100);
      options.onProgress?.(progress);
      
      // Small delay to simulate work
      await new Promise(r => setTimeout(r, 50));
    }
    
    const spaceFreed = targets.reduce((sum, t) => sum + t.file.size, 0);
    
    progress.status = 'complete';
    progress.progress = 100;
    progress.spaceFreed = spaceFreed;
    options.onProgress?.(progress);
    
    return {
      id: uuidv4(),
      startTime,
      endTime: new Date(),
      targetsProcessed: targets.length,
      spaceFreed,
      success: true,
      errors: [],
    };
  }
  
  private async simulateCleanup(targets: CleanupTarget[]): Promise<DryRunSimulation> {
    const tempDir = `${this.platformService.getTempPath()}/spacesaver_dryrun_${Date.now()}`;
    const dummyFiles: string[] = [];
    const deletedFiles: string[] = [];
    const errors: string[] = [];
    
    try {
      // Create dummy files
      for (const target of targets.slice(0, 5)) { // Limit to 5 for safety
        const dummyPath = `${tempDir}/dummy_${target.id}`;
        
        if (await this.platformService.createFile(dummyPath, 1024)) {
          dummyFiles.push(dummyPath);
        }
      }
      
      // Delete dummy files
      for (const dummyPath of dummyFiles) {
        if (await this.platformService.deleteFile(dummyPath)) {
          deletedFiles.push(dummyPath);
        } else {
          errors.push(`Failed to delete ${dummyPath}`);
        }
      }
      
      // Cleanup temp directory
      await this.platformService.deleteDirectory(tempDir, true);
      
    } catch (error) {
      errors.push(String(error));
    }
    
    return {
      dummyFilesCreated: dummyFiles,
      dummyFilesDeleted: deletedFiles,
      success: errors.length === 0,
      errors,
    };
  }
  
  private assessRisk(targets: CleanupTarget[]): RiskAssessment {
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    const warnings: string[] = [];
    
    for (const target of targets) {
      switch (target.file.riskLevel) {
        case 'high':
          highRiskCount++;
          break;
        case 'medium':
          mediumRiskCount++;
          break;
        case 'low':
          lowRiskCount++;
          break;
      }
    }
    
    // Generate warnings
    if (highRiskCount > 0) {
      warnings.push(`${highRiskCount} high-risk files selected. Review carefully before deletion.`);
    }
    
    const totalSize = targets.reduce((sum, t) => sum + t.file.size, 0);
    if (totalSize > 10 * 1024 * 1024 * 1024) { // > 10GB
      warnings.push(`Large cleanup (${formatBytes(totalSize)}). Consider creating a backup.`);
    }
    
    // Determine overall risk
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    
    if (highRiskCount > 0) {
      overallRisk = 'high';
    } else if (mediumRiskCount > lowRiskCount) {
      overallRisk = 'medium';
    }
    
    return {
      overallRisk,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      warnings,
    };
  }
}

export const cleanupService = new CleanupService();
export default cleanupService;
