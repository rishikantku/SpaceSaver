/**
 * SpaceSaver - Platform Interface
 * Abstract interface for platform-specific implementations
 * This enables easy extension to Windows and Linux in the future
 */

import {
  DiskInfo,
  DirectoryAnalysis,
  FileInfo,
  InstalledApplication,
  CleanupRule,
  BackupInfo,
  RollbackResult,
  Platform,
} from '../../types';

/**
 * Core platform interface that must be implemented for each OS
 */
export interface IPlatformService {
  /**
   * Platform identifier
   */
  getPlatform(): Platform;

  /**
   * Disk Information
   */
  getDiskInfo(): Promise<DiskInfo>;
  
  /**
   * File System Operations
   */
  getFileInfo(path: string): Promise<FileInfo>;
  getDirectorySize(path: string): Promise<number>;
  listDirectory(path: string, recursive?: boolean): Promise<FileInfo[]>;
  analyzeDirectory(path: string): Promise<DirectoryAnalysis>;
  
  /**
   * File Operations
   */
  deleteFile(path: string): Promise<boolean>;
  deleteDirectory(path: string, recursive?: boolean): Promise<boolean>;
  moveFile(source: string, destination: string): Promise<boolean>;
  copyFile(source: string, destination: string): Promise<boolean>;
  fileExists(path: string): Promise<boolean>;
  createFile(path: string, size?: number): Promise<boolean>;
  
  /**
   * Path Utilities
   */
  expandPath(path: string): string;
  getHomePath(): string;
  getTempPath(): string;
  
  /**
   * Application Management
   */
  getInstalledApplications(): Promise<InstalledApplication[]>;
  getApplicationLastUsed(bundleId: string): Promise<Date | null>;
  uninstallApplication(app: InstalledApplication): Promise<boolean>;
  openApplication(bundleId: string): Promise<boolean>;
  
  /**
   * Docker Operations (if Docker is installed)
   */
  isDockerInstalled(): Promise<boolean>;
  getDockerImages(): Promise<DockerImage[]>;
  getDockerDiskUsage(): Promise<number>;
  pruneDockerImages(olderThanDays: number): Promise<DockerPruneResult>;
  pruneDockerSystem(): Promise<DockerPruneResult>;
  
  /**
   * Cleanup Rules
   */
  getDefaultCleanupRules(): CleanupRule[];
  
  /**
   * Backup Operations
   */
  createBackup(files: string[], backupPath?: string): Promise<BackupInfo>;
  restoreBackup(backup: BackupInfo): Promise<RollbackResult>;
  deleteBackup(backupId: string): Promise<boolean>;
  listBackups(): Promise<BackupInfo[]>;
  
  /**
   * System Commands
   */
  executeCommand(command: string, args?: string[]): Promise<CommandResult>;
  openUrl(url: string): Promise<boolean>;
  openSystemPreferences(pane?: string): Promise<boolean>;
  
  /**
   * Permissions
   */
  hasFullDiskAccess(): Promise<boolean>;
  requestFullDiskAccess(): Promise<void>;
  hasCalendarAccess(): Promise<boolean>;
  
  /**
   * Checksums
   */
  calculateChecksum(path: string, algorithm?: 'md5' | 'sha256'): Promise<string>;
  verifyChecksum(path: string, expectedChecksum: string, algorithm?: 'md5' | 'sha256'): Promise<boolean>;
}

/**
 * Docker Types
 */
export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: number;
  created: Date;
  lastUsed?: Date;
}

export interface DockerPruneResult {
  imagesRemoved: number;
  spaceReclaimed: number;
  containersRemoved: number;
  volumesRemoved: number;
  success: boolean;
  errors: string[];
}

/**
 * Command execution result
 */
export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

/**
 * Platform Service Factory
 */
export type PlatformServiceFactory = () => IPlatformService;

/**
 * Platform registry for extensibility
 */
export const platformRegistry: Map<Platform, PlatformServiceFactory> = new Map();

export const registerPlatform = (platform: Platform, factory: PlatformServiceFactory) => {
  platformRegistry.set(platform, factory);
};

export const getPlatformService = (platform: Platform): IPlatformService => {
  const factory = platformRegistry.get(platform);
  if (!factory) {
    throw new Error(`Platform ${platform} is not registered`);
  }
  return factory();
};
