/**
 * SpaceSaver - Services Index
 * Export all services from a single entry point
 */

export { scannerService, ScannerService } from './ScannerService';
export type { ScanResult, ScanProgressCallback } from './ScannerService';

export { cleanupService, CleanupService } from './CleanupService';
export type { CleanupOptions, CleanupProgressCallback } from './CleanupService';

export { applicationService, ApplicationService } from './ApplicationService';
export type { ApplicationScanResult } from './ApplicationService';

export { predictionService, PredictionService } from './PredictionService';

export { cloudStorageService, CloudStorageService } from './CloudStorageService';
export type { StorageRecommendation, CloudComparisonCriteria } from './CloudStorageService';

export { autoModeService, AutoModeService } from './AutoModeService';
export type { AutoModeConfig } from './AutoModeService';
