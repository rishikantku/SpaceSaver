/**
 * SpaceSaver - Core Type Definitions
 * Production-ready type system for cross-platform disk management
 */

// ============================================================================
// Core Types
// ============================================================================

export type Platform = 'macos' | 'windows' | 'linux';

export type OperationMode = 'normal' | 'dryRun';

export interface AppConfig {
  platform: Platform;
  operationMode: OperationMode;
  autoModeEnabled: boolean;
  autoModeInterval: number; // minutes
  backupEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

// ============================================================================
// File System Types
// ============================================================================

export type FileCategory = 
  | 'cache'
  | 'logs'
  | 'temp'
  | 'downloads'
  | 'trash'
  | 'docker'
  | 'npm'
  | 'brew'
  | 'xcode'
  | 'library'
  | 'application'
  | 'media'
  | 'documents'
  | 'other';

export interface FileInfo {
  id: string;
  path: string;
  name: string;
  size: number;
  category: FileCategory;
  lastAccessed: Date;
  lastModified: Date;
  created: Date;
  isDirectory: boolean;
  canDelete: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  associatedApp?: string;
}

export interface DirectoryAnalysis {
  path: string;
  totalSize: number;
  fileCount: number;
  directoryCount: number;
  files: FileInfo[];
  lastScanned: Date;
  category: FileCategory;
}

export interface DiskInfo {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  mountPoint: string;
  fileSystem: string;
}

// ============================================================================
// Cleanup Types
// ============================================================================

export interface CleanupRule {
  id: string;
  name: string;
  description: string;
  category: FileCategory;
  enabled: boolean;
  path: string;
  pattern?: string;
  maxAge?: number; // days
  minSize?: number; // bytes
  excludePatterns?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  estimatedSavings?: number;
}

export interface CleanupTarget {
  id: string;
  file: FileInfo;
  rule: CleanupRule;
  selected: boolean;
  reason: string;
}

export interface CleanupResult {
  id: string;
  startTime: Date;
  endTime: Date;
  targetsProcessed: number;
  spaceFreed: number;
  success: boolean;
  errors: CleanupError[];
  backupId?: string;
}

export interface CleanupError {
  targetId: string;
  path: string;
  error: string;
  recoverable: boolean;
}

// ============================================================================
// Backup Types
// ============================================================================

export interface BackupInfo {
  id: string;
  createdAt: Date;
  files: BackupFileInfo[];
  totalSize: number;
  status: 'pending' | 'complete' | 'restoring' | 'restored' | 'deleted' | 'failed';
  path: string;
}

export interface BackupFileInfo {
  originalPath: string;
  backupPath: string;
  size: number;
  checksum: string;
}

export interface RollbackResult {
  backupId: string;
  success: boolean;
  filesRestored: number;
  errors: string[];
}

// ============================================================================
// Application Types
// ============================================================================

export interface InstalledApplication {
  id: string;
  name: string;
  bundleId: string;
  path: string;
  version: string;
  size: number;
  lastOpened?: Date;
  installedDate?: Date;
  category: string;
  icon?: string;
  isSystemApp: boolean;
  dataSize?: number;
  cacheSize?: number;
  associatedFiles: string[];
}

export type ApplicationSuggestion = {
  app: InstalledApplication;
  reason: string;
  potentialSavings: number;
  lastUsedDays: number;
};

// ============================================================================
// Prediction Types
// ============================================================================

export interface UsageDataPoint {
  timestamp: Date;
  usedSpace: number;
  freeSpace: number;
  dailyChange: number;
}

export interface SpacePrediction {
  predictedFullDate: Date | null;
  daysUntilFull: number | null;
  averageDailyGrowth: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number; // 0-1
  recommendations: string[];
}

export interface UsageHistory {
  dataPoints: UsageDataPoint[];
  lastUpdated: Date;
  retentionDays: number;
}

// ============================================================================
// Cloud Storage Types
// ============================================================================

export type CloudProvider = 
  | 'icloud'
  | 'dropbox'
  | 'google_drive'
  | 'onedrive'
  | 'amazon_s3'
  | 'backblaze'
  | 'wasabi';

export interface CloudStorageOption {
  id: string;
  provider: CloudProvider;
  name: string;
  description: string;
  icon: string;
  pricing: CloudPricing;
  security: SecurityFeatures;
  features: string[];
  installUrl: string;
  appStoreUrl?: string;
  isInstalled: boolean;
  recommendation: CloudRecommendation;
}

export interface CloudPricing {
  freeStorageGB: number;
  pricePerGBMonth: number;
  plans: CloudPlan[];
}

export interface CloudPlan {
  name: string;
  storageGB: number;
  pricePerMonth: number;
  features: string[];
}

export interface SecurityFeatures {
  encryption: 'aes-256' | 'aes-128' | 'none';
  zeroKnowledge: boolean;
  twoFactorAuth: boolean;
  soc2Compliant: boolean;
  gdprCompliant: boolean;
}

export interface CloudRecommendation {
  score: number; // 0-100
  bestFor: string[];
  pros: string[];
  cons: string[];
}

// ============================================================================
// UI State Types
// ============================================================================

export type ScanStatus = 'idle' | 'scanning' | 'complete' | 'error';
export type CleanupStatus = 'idle' | 'preparing' | 'backing_up' | 'cleaning' | 'verifying' | 'complete' | 'rolling_back' | 'error';

export interface ScanProgress {
  status: ScanStatus;
  currentPath?: string;
  filesScanned: number;
  totalSize: number;
  progress: number; // 0-100
  startTime?: Date;
  estimatedTimeRemaining?: number; // seconds
}

export interface CleanupProgress {
  status: CleanupStatus;
  currentFile?: string;
  filesProcessed: number;
  totalFiles: number;
  spaceFreed: number;
  progress: number; // 0-100
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  type: 'navigate' | 'dismiss' | 'custom';
  payload?: unknown;
}

// ============================================================================
// Dry Run Types
// ============================================================================

export interface DryRunResult {
  id: string;
  timestamp: Date;
  targets: CleanupTarget[];
  estimatedSpaceSaved: number;
  estimatedDuration: number; // seconds
  riskAssessment: RiskAssessment;
  simulation: DryRunSimulation;
}

export interface DryRunSimulation {
  dummyFilesCreated: string[];
  dummyFilesDeleted: string[];
  success: boolean;
  errors: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  warnings: string[];
}

// ============================================================================
// Event Types
// ============================================================================

export type AppEvent = 
  | { type: 'SCAN_STARTED' }
  | { type: 'SCAN_PROGRESS'; payload: ScanProgress }
  | { type: 'SCAN_COMPLETE'; payload: DirectoryAnalysis[] }
  | { type: 'SCAN_ERROR'; payload: string }
  | { type: 'CLEANUP_STARTED' }
  | { type: 'CLEANUP_PROGRESS'; payload: CleanupProgress }
  | { type: 'CLEANUP_COMPLETE'; payload: CleanupResult }
  | { type: 'CLEANUP_ERROR'; payload: string }
  | { type: 'BACKUP_CREATED'; payload: BackupInfo }
  | { type: 'ROLLBACK_COMPLETE'; payload: RollbackResult }
  | { type: 'AUTO_MODE_STARTED' }
  | { type: 'AUTO_MODE_STOPPED' };

export type EventHandler = (event: AppEvent) => void;
