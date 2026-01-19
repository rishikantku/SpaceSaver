/**
 * SpaceSaver - Scanner Service
 * Handles disk scanning and analysis operations
 */

import { getCurrentPlatformService, IPlatformService } from '../platform';
import {
  DirectoryAnalysis,
  FileInfo,
  CleanupRule,
  ScanProgress,
  CleanupTarget,
  DiskInfo,
} from '../types';
import { formatBytes } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export type ScanProgressCallback = (progress: ScanProgress) => void;

export interface ScanResult {
  analyses: DirectoryAnalysis[];
  targets: CleanupTarget[];
  totalScannable: number;
  diskInfo: DiskInfo;
  duration: number;
}

export class ScannerService {
  private platformService: IPlatformService;
  private abortController: AbortController | null = null;
  
  constructor() {
    this.platformService = getCurrentPlatformService();
  }
  
  /**
   * Perform a full system scan based on cleanup rules
   */
  async scanSystem(
    rules: CleanupRule[],
    onProgress?: ScanProgressCallback
  ): Promise<ScanResult> {
    this.abortController = new AbortController();
    const startTime = Date.now();
    
    const progress: ScanProgress = {
      status: 'scanning',
      filesScanned: 0,
      totalSize: 0,
      progress: 0,
      startTime: new Date(),
    };
    
    const analyses: DirectoryAnalysis[] = [];
    const targets: CleanupTarget[] = [];
    const enabledRules = rules.filter(r => r.enabled);
    
    // Get disk info first
    const diskInfo = await this.platformService.getDiskInfo();
    
    onProgress?.(progress);
    
    for (let i = 0; i < enabledRules.length; i++) {
      if (this.abortController.signal.aborted) {
        break;
      }
      
      const rule = enabledRules[i];
      const expandedPath = this.platformService.expandPath(rule.path);
      
      progress.currentPath = expandedPath;
      progress.progress = Math.round((i / enabledRules.length) * 100);
      onProgress?.(progress);
      
      try {
        // Check if path exists
        if (!(await this.platformService.fileExists(expandedPath))) {
          continue;
        }
        
        // Analyze directory
        const analysis = await this.analyzePathForRule(expandedPath, rule);
        analyses.push(analysis);
        
        // Create cleanup targets from matching files
        for (const file of analysis.files) {
          if (this.fileMatchesRule(file, rule)) {
            targets.push({
              id: uuidv4(),
              file,
              rule,
              selected: rule.riskLevel !== 'high', // Pre-select low/medium risk
              reason: this.getCleanupReason(file, rule),
            });
          }
        }
        
        progress.filesScanned += analysis.fileCount;
        progress.totalSize += analysis.totalSize;
        
      } catch (error) {
        console.error(`Error scanning ${expandedPath}:`, error);
      }
    }
    
    progress.status = 'complete';
    progress.progress = 100;
    onProgress?.(progress);
    
    const totalScannable = targets.reduce((sum, t) => sum + t.file.size, 0);
    
    return {
      analyses,
      targets,
      totalScannable,
      diskInfo,
      duration: Date.now() - startTime,
    };
  }
  
  /**
   * Scan a specific path
   */
  async scanPath(path: string): Promise<DirectoryAnalysis> {
    const expandedPath = this.platformService.expandPath(path);
    return await this.platformService.analyzeDirectory(expandedPath);
  }
  
  /**
   * Quick scan for dashboard overview
   */
  async quickScan(rules: CleanupRule[]): Promise<{
    estimatedSavings: number;
    categories: Record<string, number>;
    largestTargets: CleanupTarget[];
  }> {
    let estimatedSavings = 0;
    const categories: Record<string, number> = {};
    const allTargets: CleanupTarget[] = [];
    
    const enabledRules = rules.filter(r => r.enabled);
    
    for (const rule of enabledRules) {
      const expandedPath = this.platformService.expandPath(rule.path);
      
      try {
        if (!(await this.platformService.fileExists(expandedPath))) {
          continue;
        }
        
        const size = await this.platformService.getDirectorySize(expandedPath);
        estimatedSavings += size;
        
        categories[rule.category] = (categories[rule.category] || 0) + size;
        
        // Create a summary target
        const fileInfo = await this.platformService.getFileInfo(expandedPath);
        allTargets.push({
          id: uuidv4(),
          file: fileInfo,
          rule,
          selected: false,
          reason: `${rule.name}: ${formatBytes(size)}`,
        });
        
      } catch (error) {
        // Path doesn't exist or no access
      }
    }
    
    // Sort by size and get top 10
    const largestTargets = allTargets
      .sort((a, b) => b.file.size - a.file.size)
      .slice(0, 10);
    
    return {
      estimatedSavings,
      categories,
      largestTargets,
    };
  }
  
  /**
   * Cancel ongoing scan
   */
  cancelScan(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
  
  /**
   * Get estimated time to complete scan
   */
  estimateScanTime(rules: CleanupRule[]): number {
    // Rough estimate: 1 second per rule path
    return rules.filter(r => r.enabled).length * 1000;
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private async analyzePathForRule(
    path: string,
    rule: CleanupRule
  ): Promise<DirectoryAnalysis> {
    const analysis = await this.platformService.analyzeDirectory(path);
    
    // Filter files based on rule criteria
    if (rule.maxAge || rule.minSize || rule.pattern || rule.excludePatterns) {
      const now = new Date();
      
      analysis.files = analysis.files.filter(file => {
        // Check age
        if (rule.maxAge) {
          const ageInDays = (now.getTime() - file.lastModified.getTime()) / (1000 * 60 * 60 * 24);
          if (ageInDays < rule.maxAge) {
            return false;
          }
        }
        
        // Check size
        if (rule.minSize && file.size < rule.minSize) {
          return false;
        }
        
        // Check pattern
        if (rule.pattern) {
          const regex = new RegExp(rule.pattern);
          if (!regex.test(file.name)) {
            return false;
          }
        }
        
        // Check exclude patterns
        if (rule.excludePatterns) {
          for (const exclude of rule.excludePatterns) {
            const excludeRegex = new RegExp(exclude);
            if (excludeRegex.test(file.path)) {
              return false;
            }
          }
        }
        
        return true;
      });
      
      // Recalculate totals
      analysis.totalSize = analysis.files.reduce((sum, f) => sum + f.size, 0);
      analysis.fileCount = analysis.files.filter(f => !f.isDirectory).length;
      analysis.directoryCount = analysis.files.filter(f => f.isDirectory).length;
    }
    
    return analysis;
  }
  
  private fileMatchesRule(file: FileInfo, rule: CleanupRule): boolean {
    const now = new Date();
    
    // Check age
    if (rule.maxAge) {
      const ageInDays = (now.getTime() - file.lastModified.getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < rule.maxAge) {
        return false;
      }
    }
    
    // Check size
    if (rule.minSize && file.size < rule.minSize) {
      return false;
    }
    
    // Check exclude patterns
    if (rule.excludePatterns) {
      for (const exclude of rule.excludePatterns) {
        const excludeRegex = new RegExp(exclude);
        if (excludeRegex.test(file.path)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  private getCleanupReason(file: FileInfo, rule: CleanupRule): string {
    const reasons: string[] = [];
    
    if (rule.maxAge) {
      const ageInDays = Math.floor(
        (new Date().getTime() - file.lastModified.getTime()) / (1000 * 60 * 60 * 24)
      );
      reasons.push(`Not modified in ${ageInDays} days`);
    }
    
    reasons.push(rule.description);
    
    return reasons.join('. ');
  }
}

export const scannerService = new ScannerService();
export default scannerService;
