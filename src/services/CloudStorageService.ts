/**
 * SpaceSaver - Cloud Storage Service
 * Suggests and manages cloud storage integrations
 */

import { getCurrentPlatformService, IPlatformService } from '../platform';
import { CloudStorageOption, FileInfo } from '../types';
import { CLOUD_STORAGE_OPTIONS } from '../constants';

export interface StorageRecommendation {
  provider: CloudStorageOption;
  score: number;
  reason: string;
  estimatedMonthlyCost: number;
  matchedCriteria: string[];
}

export interface CloudComparisonCriteria {
  storageNeeded: number; // bytes
  prioritizeCost: boolean;
  prioritizeSecurity: boolean;
  prioritizeIntegration: boolean;
  fileTypes: ('documents' | 'media' | 'backups' | 'mixed')[];
  needsZeroKnowledge: boolean;
}

export class CloudStorageService {
  private platformService: IPlatformService;
  private providers: CloudStorageOption[];
  
  constructor() {
    this.platformService = getCurrentPlatformService();
    this.providers = [...CLOUD_STORAGE_OPTIONS];
    this.checkInstalledProviders();
  }
  
  /**
   * Get all cloud storage options
   */
  getProviders(): CloudStorageOption[] {
    return this.providers;
  }
  
  /**
   * Get provider by ID
   */
  getProvider(id: string): CloudStorageOption | undefined {
    return this.providers.find(p => p.id === id);
  }
  
  /**
   * Get installed providers
   */
  getInstalledProviders(): CloudStorageOption[] {
    return this.providers.filter(p => p.isInstalled);
  }
  
  /**
   * Get recommendations based on criteria
   */
  getRecommendations(criteria: CloudComparisonCriteria): StorageRecommendation[] {
    const recommendations: StorageRecommendation[] = [];
    
    for (const provider of this.providers) {
      const { score, matchedCriteria } = this.calculateProviderScore(provider, criteria);
      const estimatedMonthlyCost = this.estimateMonthlyCost(provider, criteria.storageNeeded);
      
      recommendations.push({
        provider,
        score,
        reason: this.generateRecommendationReason(provider, matchedCriteria, criteria),
        estimatedMonthlyCost,
        matchedCriteria,
      });
    }
    
    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Get best provider for media files
   */
  getBestForMedia(): StorageRecommendation[] {
    return this.getRecommendations({
      storageNeeded: 100 * 1024 * 1024 * 1024, // 100GB
      prioritizeCost: true,
      prioritizeSecurity: false,
      prioritizeIntegration: true,
      fileTypes: ['media'],
      needsZeroKnowledge: false,
    });
  }
  
  /**
   * Get best provider for backups
   */
  getBestForBackups(): StorageRecommendation[] {
    return this.getRecommendations({
      storageNeeded: 500 * 1024 * 1024 * 1024, // 500GB
      prioritizeCost: true,
      prioritizeSecurity: true,
      prioritizeIntegration: false,
      fileTypes: ['backups'],
      needsZeroKnowledge: true,
    });
  }
  
  /**
   * Get best provider for documents
   */
  getBestForDocuments(): StorageRecommendation[] {
    return this.getRecommendations({
      storageNeeded: 50 * 1024 * 1024 * 1024, // 50GB
      prioritizeCost: false,
      prioritizeSecurity: true,
      prioritizeIntegration: true,
      fileTypes: ['documents'],
      needsZeroKnowledge: false,
    });
  }
  
  /**
   * Compare providers side by side
   */
  compareProviders(providerIds: string[]): {
    providers: CloudStorageOption[];
    comparison: {
      category: string;
      values: Record<string, string | number | boolean>;
    }[];
  } {
    const providers = providerIds
      .map(id => this.getProvider(id))
      .filter(Boolean) as CloudStorageOption[];
    
    const comparison = [
      {
        category: 'Free Storage',
        values: providers.reduce((acc, p) => ({
          ...acc,
          [p.id]: `${p.pricing.freeStorageGB} GB`,
        }), {}),
      },
      {
        category: 'Price per GB/month',
        values: providers.reduce((acc, p) => ({
          ...acc,
          [p.id]: `$${p.pricing.pricePerGBMonth.toFixed(4)}`,
        }), {}),
      },
      {
        category: 'Encryption',
        values: providers.reduce((acc, p) => ({
          ...acc,
          [p.id]: p.security.encryption.toUpperCase(),
        }), {}),
      },
      {
        category: 'Zero Knowledge',
        values: providers.reduce((acc, p) => ({
          ...acc,
          [p.id]: p.security.zeroKnowledge ? '✓' : '✗',
        }), {}),
      },
      {
        category: '2FA Support',
        values: providers.reduce((acc, p) => ({
          ...acc,
          [p.id]: p.security.twoFactorAuth ? '✓' : '✗',
        }), {}),
      },
      {
        category: 'GDPR Compliant',
        values: providers.reduce((acc, p) => ({
          ...acc,
          [p.id]: p.security.gdprCompliant ? '✓' : '✗',
        }), {}),
      },
      {
        category: 'Installed',
        values: providers.reduce((acc, p) => ({
          ...acc,
          [p.id]: p.isInstalled ? '✓' : '✗',
        }), {}),
      },
    ];
    
    return { providers, comparison };
  }
  
  /**
   * Install a cloud storage provider
   */
  async installProvider(providerId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const provider = this.getProvider(providerId);
    
    if (!provider) {
      return {
        success: false,
        message: 'Provider not found',
      };
    }
    
    if (provider.isInstalled) {
      return {
        success: true,
        message: `${provider.name} is already installed`,
      };
    }
    
    try {
      // Try App Store first if available
      if (provider.appStoreUrl) {
        await this.platformService.openUrl(provider.appStoreUrl);
        return {
          success: true,
          message: `Opening App Store to install ${provider.name}`,
        };
      }
      
      // Otherwise, open the download URL
      await this.platformService.openUrl(provider.installUrl);
      return {
        success: true,
        message: `Opening download page for ${provider.name}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to open install page: ${error}`,
      };
    }
  }
  
  /**
   * Get suggestions for large files
   */
  getSuggestionsForFiles(files: FileInfo[]): {
    files: FileInfo[];
    totalSize: number;
    recommendations: StorageRecommendation[];
    estimatedMonthlyCost: number;
  } {
    // Filter to large files (> 100MB)
    const largeFiles = files.filter(f => f.size > 100 * 1024 * 1024);
    const totalSize = largeFiles.reduce((sum, f) => sum + f.size, 0);
    
    // Determine file types
    const hasMedia = largeFiles.some(f => 
      /\.(mp4|mov|avi|mkv|mp3|wav|flac|jpg|jpeg|png|heic|raw)$/i.test(f.name)
    );
    const hasDocuments = largeFiles.some(f =>
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(f.name)
    );
    const hasBackups = largeFiles.some(f =>
      /\.(zip|tar|gz|7z|dmg|iso|sparsebundle)$/i.test(f.name)
    );
    
    const fileTypes: ('documents' | 'media' | 'backups' | 'mixed')[] = [];
    if (hasMedia) fileTypes.push('media');
    if (hasDocuments) fileTypes.push('documents');
    if (hasBackups) fileTypes.push('backups');
    if (fileTypes.length === 0) fileTypes.push('mixed');
    
    const recommendations = this.getRecommendations({
      storageNeeded: totalSize,
      prioritizeCost: true,
      prioritizeSecurity: hasDocuments,
      prioritizeIntegration: true,
      fileTypes,
      needsZeroKnowledge: hasBackups,
    });
    
    // Calculate estimated cost using top recommendation
    const topRecommendation = recommendations[0];
    const estimatedMonthlyCost = topRecommendation
      ? this.estimateMonthlyCost(topRecommendation.provider, totalSize)
      : 0;
    
    return {
      files: largeFiles,
      totalSize,
      recommendations: recommendations.slice(0, 3),
      estimatedMonthlyCost,
    };
  }
  
  /**
   * Refresh installed status for all providers
   */
  async checkInstalledProviders(): Promise<void> {
    // Check if provider apps are installed
    const appChecks: Record<string, string> = {
      icloud: 'com.apple.CloudDocs', // Always installed on macOS
      dropbox: 'com.getdropbox.dropbox',
      google_drive: 'com.google.drivefs',
      onedrive: 'com.microsoft.OneDrive',
    };
    
    for (const provider of this.providers) {
      const bundleId = appChecks[provider.provider];
      if (bundleId) {
        // In production, check if app is actually installed
        // For now, we'll mark iCloud as always installed on macOS
        provider.isInstalled = provider.provider === 'icloud';
      }
    }
  }
  
  // ============================================================================
  // Private Methods
  // ============================================================================
  
  private calculateProviderScore(
    provider: CloudStorageOption,
    criteria: CloudComparisonCriteria
  ): { score: number; matchedCriteria: string[] } {
    let score = provider.recommendation.score;
    const matchedCriteria: string[] = [];
    
    // Free storage bonus
    const storageNeededGB = criteria.storageNeeded / (1024 * 1024 * 1024);
    if (provider.pricing.freeStorageGB >= storageNeededGB) {
      score += 20;
      matchedCriteria.push('Free storage covers your needs');
    }
    
    // Cost priority
    if (criteria.prioritizeCost) {
      // Lower price per GB = higher score
      const costScore = (0.01 - provider.pricing.pricePerGBMonth) * 1000;
      score += Math.max(0, costScore);
      
      if (provider.pricing.pricePerGBMonth < 0.005) {
        matchedCriteria.push('Low cost per GB');
      }
    }
    
    // Security priority
    if (criteria.prioritizeSecurity) {
      if (provider.security.encryption === 'aes-256') {
        score += 10;
        matchedCriteria.push('AES-256 encryption');
      }
      if (provider.security.soc2Compliant) {
        score += 5;
        matchedCriteria.push('SOC2 compliant');
      }
      if (provider.security.gdprCompliant) {
        score += 5;
        matchedCriteria.push('GDPR compliant');
      }
    }
    
    // Zero knowledge requirement
    if (criteria.needsZeroKnowledge) {
      if (provider.security.zeroKnowledge) {
        score += 30;
        matchedCriteria.push('Zero-knowledge encryption');
      } else {
        score -= 20;
      }
    }
    
    // Integration priority
    if (criteria.prioritizeIntegration) {
      if (provider.isInstalled) {
        score += 15;
        matchedCriteria.push('Already installed');
      }
      if (provider.provider === 'icloud') {
        score += 10;
        matchedCriteria.push('Native macOS integration');
      }
    }
    
    // File type matching
    for (const fileType of criteria.fileTypes) {
      const bestFor = provider.recommendation.bestFor.join(' ').toLowerCase();
      if (bestFor.includes(fileType)) {
        score += 10;
        matchedCriteria.push(`Good for ${fileType}`);
      }
    }
    
    return { score: Math.min(100, Math.max(0, score)), matchedCriteria };
  }
  
  private estimateMonthlyCost(provider: CloudStorageOption, storageNeeded: number): number {
    const storageNeededGB = storageNeeded / (1024 * 1024 * 1024);
    
    // Check if free tier covers it
    if (storageNeededGB <= provider.pricing.freeStorageGB) {
      return 0;
    }
    
    // Find the best plan
    for (const plan of provider.pricing.plans) {
      if (plan.storageGB >= storageNeededGB || plan.storageGB === -1) {
        return plan.pricePerMonth;
      }
    }
    
    // Pay per GB for overflow
    const paidStorage = storageNeededGB - provider.pricing.freeStorageGB;
    return paidStorage * provider.pricing.pricePerGBMonth;
  }
  
  private generateRecommendationReason(
    _provider: CloudStorageOption,
    matchedCriteria: string[],
    _criteria: CloudComparisonCriteria
  ): string {
    if (matchedCriteria.length === 0) {
      return 'Basic cloud storage option';
    }
    
    const topCriteria = matchedCriteria.slice(0, 2);
    return topCriteria.join('. ') + '.';
  }
}

export const cloudStorageService = new CloudStorageService();
export default cloudStorageService;
