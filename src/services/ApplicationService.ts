/**
 * SpaceSaver - Application Service
 * Handles installed application scanning and management
 */

import { getCurrentPlatformService, IPlatformService } from '../platform';
import {
  InstalledApplication,
  ApplicationSuggestion,
} from '../types';
import { APP_INACTIVITY_THRESHOLDS, formatBytes } from '../constants';

export interface ApplicationScanResult {
  applications: InstalledApplication[];
  suggestions: ApplicationSuggestion[];
  totalSize: number;
  unusedSize: number;
}

export class ApplicationService {
  private platformService: IPlatformService;
  private cachedApplications: InstalledApplication[] = [];
  private lastScanTimeValue: Date | null = null;
  
  constructor() {
    this.platformService = getCurrentPlatformService();
  }
  
  /**
   * Get last scan time
   */
  get lastScanTime(): Date | null {
    return this.lastScanTimeValue;
  }
  
  /**
   * Scan all installed applications
   */
  async scanApplications(): Promise<ApplicationScanResult> {
    const applications = await this.platformService.getInstalledApplications();
    this.cachedApplications = applications;
    this.lastScanTimeValue = new Date();
    
    // Calculate additional metrics for each app
    for (const app of applications) {
      // Get cache and data sizes
      app.cacheSize = await this.getAppCacheSize(app);
      app.dataSize = await this.getAppDataSize(app);
      
      // Ensure we have last opened date
      if (!app.lastOpened) {
        app.lastOpened = await this.platformService.getApplicationLastUsed(app.bundleId) || undefined;
      }
    }
    
    const suggestions = this.generateSuggestions(applications);
    const totalSize = applications.reduce((sum, app) => sum + app.size, 0);
    const unusedSize = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);
    
    return {
      applications,
      suggestions,
      totalSize,
      unusedSize,
    };
  }
  
  /**
   * Get cached applications (from last scan)
   */
  getCachedApplications(): InstalledApplication[] {
    return this.cachedApplications;
  }
  
  /**
   * Get application by bundle ID
   */
  getApplicationByBundleId(bundleId: string): InstalledApplication | undefined {
    return this.cachedApplications.find(app => app.bundleId === bundleId);
  }
  
  /**
   * Generate uninstall suggestions based on usage
   */
  generateSuggestions(applications: InstalledApplication[]): ApplicationSuggestion[] {
    const suggestions: ApplicationSuggestion[] = [];
    const now = new Date();
    
    for (const app of applications) {
      // Skip system apps
      if (app.isSystemApp) {
        continue;
      }
      
      // Check if app hasn't been used
      if (app.lastOpened) {
        const daysSinceUse = Math.floor(
          (now.getTime() - app.lastOpened.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceUse >= APP_INACTIVITY_THRESHOLDS.SUGGEST_UNINSTALL) {
          suggestions.push({
            app,
            reason: `Not opened in ${daysSinceUse} days (over ${APP_INACTIVITY_THRESHOLDS.SUGGEST_UNINSTALL / 30} months)`,
            potentialSavings: app.size + (app.cacheSize || 0) + (app.dataSize || 0),
            lastUsedDays: daysSinceUse,
          });
        } else if (daysSinceUse >= APP_INACTIVITY_THRESHOLDS.WARNING) {
          suggestions.push({
            app,
            reason: `Not opened in ${daysSinceUse} days`,
            potentialSavings: app.size + (app.cacheSize || 0) + (app.dataSize || 0),
            lastUsedDays: daysSinceUse,
          });
        }
      } else {
        // No usage data - might be unused
        if (app.size > 100 * 1024 * 1024) { // > 100MB
          suggestions.push({
            app,
            reason: 'No usage data available. Large app with unknown usage.',
            potentialSavings: app.size + (app.cacheSize || 0) + (app.dataSize || 0),
            lastUsedDays: -1,
          });
        }
      }
    }
    
    // Sort by potential savings (largest first)
    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }
  
  /**
   * Uninstall an application
   */
  async uninstallApplication(app: InstalledApplication): Promise<{
    success: boolean;
    spaceFreed: number;
    message: string;
  }> {
    // System apps cannot be uninstalled
    if (app.isSystemApp) {
      return {
        success: false,
        spaceFreed: 0,
        message: 'System applications cannot be uninstalled',
      };
    }
    
    const totalSize = app.size + (app.cacheSize || 0) + (app.dataSize || 0);
    
    try {
      const success = await this.platformService.uninstallApplication(app);
      
      if (success) {
        // Remove from cache
        this.cachedApplications = this.cachedApplications.filter(
          a => a.bundleId !== app.bundleId
        );
        
        return {
          success: true,
          spaceFreed: totalSize,
          message: `Successfully uninstalled ${app.name}. Freed ${formatBytes(totalSize)}.`,
        };
      } else {
        return {
          success: false,
          spaceFreed: 0,
          message: `Failed to uninstall ${app.name}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        spaceFreed: 0,
        message: `Error uninstalling ${app.name}: ${error}`,
      };
    }
  }
  
  /**
   * Open an application
   */
  async openApplication(bundleId: string): Promise<boolean> {
    return await this.platformService.openApplication(bundleId);
  }
  
  /**
   * Get applications grouped by category
   */
  getApplicationsByCategory(): Record<string, InstalledApplication[]> {
    const grouped: Record<string, InstalledApplication[]> = {};
    
    for (const app of this.cachedApplications) {
      const category = app.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(app);
    }
    
    return grouped;
  }
  
  /**
   * Get applications sorted by size
   */
  getApplicationsBySize(): InstalledApplication[] {
    return [...this.cachedApplications].sort((a, b) => b.size - a.size);
  }
  
  /**
   * Get applications sorted by last used
   */
  getApplicationsByLastUsed(): InstalledApplication[] {
    return [...this.cachedApplications].sort((a, b) => {
      if (!a.lastOpened && !b.lastOpened) return 0;
      if (!a.lastOpened) return 1;
      if (!b.lastOpened) return -1;
      return a.lastOpened.getTime() - b.lastOpened.getTime();
    });
  }
  
  /**
   * Search applications
   */
  searchApplications(query: string): InstalledApplication[] {
    const lowerQuery = query.toLowerCase();
    
    return this.cachedApplications.filter(app =>
      app.name.toLowerCase().includes(lowerQuery) ||
      app.bundleId.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Get statistics about installed applications
   */
  getStatistics(): {
    totalApps: number;
    totalSize: number;
    systemApps: number;
    recentlyUsed: number;
    neverUsed: number;
    avgSize: number;
  } {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalSize = this.cachedApplications.reduce((sum, app) => sum + app.size, 0);
    const systemApps = this.cachedApplications.filter(app => app.isSystemApp).length;
    const recentlyUsed = this.cachedApplications.filter(
      app => app.lastOpened && app.lastOpened > thirtyDaysAgo
    ).length;
    const neverUsed = this.cachedApplications.filter(app => !app.lastOpened).length;
    
    return {
      totalApps: this.cachedApplications.length,
      totalSize,
      systemApps,
      recentlyUsed,
      neverUsed,
      avgSize: this.cachedApplications.length > 0 
        ? Math.round(totalSize / this.cachedApplications.length) 
        : 0,
    };
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private async getAppCacheSize(app: InstalledApplication): Promise<number> {
    const homePath = this.platformService.getHomePath();
    const cachePaths = [
      `${homePath}/Library/Caches/${app.bundleId}`,
      `${homePath}/Library/Caches/com.${app.name.toLowerCase().replace(/\s+/g, '')}`,
    ];
    
    let totalSize = 0;
    
    for (const cachePath of cachePaths) {
      if (await this.platformService.fileExists(cachePath)) {
        totalSize += await this.platformService.getDirectorySize(cachePath);
      }
    }
    
    return totalSize;
  }
  
  private async getAppDataSize(app: InstalledApplication): Promise<number> {
    const homePath = this.platformService.getHomePath();
    const dataPaths = [
      `${homePath}/Library/Application Support/${app.name}`,
      `${homePath}/Library/Application Support/${app.bundleId}`,
      `${homePath}/Library/Preferences/${app.bundleId}.plist`,
      `${homePath}/Library/Saved Application State/${app.bundleId}.savedState`,
    ];
    
    let totalSize = 0;
    
    for (const dataPath of dataPaths) {
      if (await this.platformService.fileExists(dataPath)) {
        totalSize += await this.platformService.getDirectorySize(dataPath);
      }
    }
    
    return totalSize;
  }
}

export const applicationService = new ApplicationService();
export default applicationService;
