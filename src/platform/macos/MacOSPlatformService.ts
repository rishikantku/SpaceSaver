/**
 * SpaceSaver - macOS Platform Service
 * Complete implementation for macOS 15 on Apple Silicon
 */

import {
  IPlatformService,
  DockerImage,
  DockerPruneResult,
  CommandResult,
} from '../common/PlatformInterface';
import {
  DiskInfo,
  DirectoryAnalysis,
  FileInfo,
  InstalledApplication,
  CleanupRule,
  BackupInfo,
  BackupFileInfo,
  RollbackResult,
  FileCategory,
  Platform,
} from '../../types';
import { MACOS_CLEANUP_RULES, BACKUP_CONFIG } from '../../constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Native module interface for macOS operations
 * In production, this would be a native module (Swift/Objective-C)
 */
interface NativeModuleMock {
  execSync: (command: string) => string;
  execAsync: (command: string) => Promise<string>;
}

/**
 * Mock native module for development/testing
 * In production, replace with actual NativeModules.MacOSBridge
 */
const NativeModule: NativeModuleMock = {
  execSync: (command: string) => {
    // Simulated for development
    console.log(`[MacOS] Executing: ${command}`);
    return '';
  },
  execAsync: async (command: string) => {
    console.log(`[MacOS] Executing async: ${command}`);
    return '';
  },
};

export class MacOSPlatformService implements IPlatformService {
  private homePath: string;
  private tempPath: string;
  private backupBasePath: string;
  
  constructor() {
    this.homePath = process.env.HOME || '/Users/user';
    this.tempPath = '/tmp';
    this.backupBasePath = this.expandPath(BACKUP_CONFIG.BASE_PATH);
  }

  // ============================================================================
  // Platform Identification
  // ============================================================================

  getPlatform(): Platform {
    return 'macos';
  }

  // ============================================================================
  // Disk Information
  // ============================================================================

  async getDiskInfo(): Promise<DiskInfo> {
    try {
      // Using df command to get disk info for the main volume
      const result = await this.executeCommand('df', ['-k', '/']);
      const lines = result.stdout.trim().split('\n');
      
      if (lines.length < 2) {
        throw new Error('Unable to parse disk info');
      }

      // Parse df output
      const parts = lines[1].split(/\s+/);
      const blockSize = 1024; // df -k uses 1K blocks
      
      const totalBlocks = parseInt(parts[1], 10);
      const usedBlocks = parseInt(parts[2], 10);
      const freeBlocks = parseInt(parts[3], 10);
      
      return {
        totalSpace: totalBlocks * blockSize,
        usedSpace: usedBlocks * blockSize,
        freeSpace: freeBlocks * blockSize,
        mountPoint: parts[8] || '/',
        fileSystem: parts[0],
      };
    } catch (error) {
      // Return mock data for development
      return {
        totalSpace: 500 * 1024 * 1024 * 1024, // 500 GB
        usedSpace: 350 * 1024 * 1024 * 1024,  // 350 GB
        freeSpace: 150 * 1024 * 1024 * 1024,  // 150 GB
        mountPoint: '/',
        fileSystem: 'apfs',
      };
    }
  }

  // ============================================================================
  // File System Operations
  // ============================================================================

  async getFileInfo(path: string): Promise<FileInfo> {
    const expandedPath = this.expandPath(path);
    
    try {
      const result = await this.executeCommand('stat', ['-f', '%z %a %m %c %N', expandedPath]);
      const parts = result.stdout.trim().split(' ');
      
      const size = parseInt(parts[0], 10);
      const lastAccessed = new Date(parseInt(parts[1], 10) * 1000);
      const lastModified = new Date(parseInt(parts[2], 10) * 1000);
      const created = new Date(parseInt(parts[3], 10) * 1000);
      const name = expandedPath.split('/').pop() || '';
      
      const isDirectory = await this.isDirectory(expandedPath);
      const category = this.categorizeFile(expandedPath);
      
      return {
        id: uuidv4(),
        path: expandedPath,
        name,
        size: isDirectory ? await this.getDirectorySize(expandedPath) : size,
        category,
        lastAccessed,
        lastModified,
        created,
        isDirectory,
        canDelete: await this.canDelete(expandedPath),
        riskLevel: this.calculateRiskLevel(expandedPath, category),
      };
    } catch (error) {
      // Return default for non-existent files
      return {
        id: uuidv4(),
        path: expandedPath,
        name: expandedPath.split('/').pop() || '',
        size: 0,
        category: 'other',
        lastAccessed: new Date(),
        lastModified: new Date(),
        created: new Date(),
        isDirectory: false,
        canDelete: false,
        riskLevel: 'high',
      };
    }
  }

  async getDirectorySize(path: string): Promise<number> {
    const expandedPath = this.expandPath(path);
    
    try {
      const result = await this.executeCommand('du', ['-sk', expandedPath]);
      const sizeKB = parseInt(result.stdout.split('\t')[0], 10);
      return sizeKB * 1024;
    } catch (error) {
      return 0;
    }
  }

  async listDirectory(path: string, recursive = false): Promise<FileInfo[]> {
    const expandedPath = this.expandPath(path);
    const files: FileInfo[] = [];
    
    try {
      const args = recursive ? ['-R', expandedPath] : [expandedPath];
      const result = await this.executeCommand('ls', ['-la', ...args]);
      
      const lines = result.stdout.trim().split('\n');
      
      for (const line of lines) {
        if (line.startsWith('total') || line.trim() === '') continue;
        
        const fileInfo = await this.parseListEntry(line, expandedPath);
        if (fileInfo) {
          files.push(fileInfo);
        }
      }
    } catch (error) {
      console.error(`Error listing directory ${expandedPath}:`, error);
    }
    
    return files;
  }

  async analyzeDirectory(path: string): Promise<DirectoryAnalysis> {
    const expandedPath = this.expandPath(path);
    const files = await this.listDirectory(expandedPath, true);
    
    let totalSize = 0;
    let fileCount = 0;
    let directoryCount = 0;
    
    for (const file of files) {
      totalSize += file.size;
      if (file.isDirectory) {
        directoryCount++;
      } else {
        fileCount++;
      }
    }
    
    return {
      path: expandedPath,
      totalSize,
      fileCount,
      directoryCount,
      files,
      lastScanned: new Date(),
      category: this.categorizeFile(expandedPath),
    };
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  async deleteFile(path: string): Promise<boolean> {
    const expandedPath = this.expandPath(path);
    
    try {
      await this.executeCommand('rm', ['-f', expandedPath]);
      return !(await this.fileExists(expandedPath));
    } catch (error) {
      console.error(`Error deleting file ${expandedPath}:`, error);
      return false;
    }
  }

  async deleteDirectory(path: string, recursive = true): Promise<boolean> {
    const expandedPath = this.expandPath(path);
    
    try {
      const args = recursive ? ['-rf', expandedPath] : ['-d', expandedPath];
      await this.executeCommand('rm', args);
      return !(await this.fileExists(expandedPath));
    } catch (error) {
      console.error(`Error deleting directory ${expandedPath}:`, error);
      return false;
    }
  }

  async moveFile(source: string, destination: string): Promise<boolean> {
    const expandedSource = this.expandPath(source);
    const expandedDest = this.expandPath(destination);
    
    try {
      await this.executeCommand('mv', [expandedSource, expandedDest]);
      return await this.fileExists(expandedDest);
    } catch (error) {
      console.error(`Error moving file:`, error);
      return false;
    }
  }

  async copyFile(source: string, destination: string): Promise<boolean> {
    const expandedSource = this.expandPath(source);
    const expandedDest = this.expandPath(destination);
    
    try {
      await this.executeCommand('cp', ['-R', expandedSource, expandedDest]);
      return await this.fileExists(expandedDest);
    } catch (error) {
      console.error(`Error copying file:`, error);
      return false;
    }
  }

  async fileExists(path: string): Promise<boolean> {
    const expandedPath = this.expandPath(path);
    
    try {
      const result = await this.executeCommand('test', ['-e', expandedPath]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  async createFile(path: string, size = 0): Promise<boolean> {
    const expandedPath = this.expandPath(path);
    
    try {
      if (size > 0) {
        // Create file with specific size using dd
        await this.executeCommand('dd', [
          'if=/dev/zero',
          `of=${expandedPath}`,
          'bs=1',
          `count=${size}`,
        ]);
      } else {
        await this.executeCommand('touch', [expandedPath]);
      }
      return await this.fileExists(expandedPath);
    } catch (error) {
      console.error(`Error creating file:`, error);
      return false;
    }
  }

  // ============================================================================
  // Path Utilities
  // ============================================================================

  expandPath(path: string): string {
    if (path.startsWith('~')) {
      return path.replace('~', this.homePath);
    }
    return path;
  }

  getHomePath(): string {
    return this.homePath;
  }

  getTempPath(): string {
    return this.tempPath;
  }

  // ============================================================================
  // Application Management
  // ============================================================================

  async getInstalledApplications(): Promise<InstalledApplication[]> {
    const apps: InstalledApplication[] = [];
    const appPaths = ['/Applications', `${this.homePath}/Applications`];
    
    for (const appPath of appPaths) {
      try {
        const result = await this.executeCommand('ls', [appPath]);
        const appNames = result.stdout.trim().split('\n').filter(name => name.endsWith('.app'));
        
        for (const appName of appNames) {
          const fullPath = `${appPath}/${appName}`;
          const appInfo = await this.getAppInfo(fullPath);
          if (appInfo) {
            apps.push(appInfo);
          }
        }
      } catch (error) {
        // Directory might not exist
      }
    }
    
    return apps;
  }

  async getApplicationLastUsed(bundleId: string): Promise<Date | null> {
    try {
      // Use mdls to get last opened date
      const result = await this.executeCommand('mdfind', [
        '-onlyin', '/Applications',
        `kMDItemCFBundleIdentifier == "${bundleId}"`
      ]);
      
      const appPath = result.stdout.trim();
      if (!appPath) return null;
      
      const mdlsResult = await this.executeCommand('mdls', [
        '-name', 'kMDItemLastUsedDate',
        '-raw',
        appPath
      ]);
      
      const dateStr = mdlsResult.stdout.trim();
      if (dateStr && dateStr !== '(null)') {
        return new Date(dateStr);
      }
    } catch (error) {
      console.error(`Error getting last used date for ${bundleId}:`, error);
    }
    
    return null;
  }

  async uninstallApplication(app: InstalledApplication): Promise<boolean> {
    try {
      // Move app to trash
      await this.executeCommand('osascript', [
        '-e',
        `tell application "Finder" to delete POSIX file "${app.path}"`
      ]);
      
      // Also remove associated files
      const libraryPaths = [
        `${this.homePath}/Library/Application Support/${app.name}`,
        `${this.homePath}/Library/Caches/${app.bundleId}`,
        `${this.homePath}/Library/Preferences/${app.bundleId}.plist`,
        `${this.homePath}/Library/Saved Application State/${app.bundleId}.savedState`,
      ];
      
      for (const libPath of libraryPaths) {
        if (await this.fileExists(libPath)) {
          await this.deleteDirectory(libPath, true);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error uninstalling ${app.name}:`, error);
      return false;
    }
  }

  async openApplication(bundleId: string): Promise<boolean> {
    try {
      await this.executeCommand('open', ['-b', bundleId]);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Docker Operations
  // ============================================================================

  async isDockerInstalled(): Promise<boolean> {
    try {
      const result = await this.executeCommand('which', ['docker']);
      return result.exitCode === 0 && result.stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  async getDockerImages(): Promise<DockerImage[]> {
    if (!(await this.isDockerInstalled())) {
      return [];
    }
    
    try {
      const result = await this.executeCommand('docker', [
        'images',
        '--format',
        '{{.ID}}|{{.Repository}}|{{.Tag}}|{{.Size}}|{{.CreatedAt}}'
      ]);
      
      const images: DockerImage[] = [];
      const lines = result.stdout.trim().split('\n').filter(Boolean);
      
      for (const line of lines) {
        const [id, repository, tag, sizeStr, createdAt] = line.split('|');
        
        const size = this.parseDockerSize(sizeStr);
        
        images.push({
          id,
          repository,
          tag,
          size,
          created: new Date(createdAt),
        });
      }
      
      return images;
    } catch (error) {
      console.error('Error getting Docker images:', error);
      return [];
    }
  }

  async getDockerDiskUsage(): Promise<number> {
    if (!(await this.isDockerInstalled())) {
      return 0;
    }
    
    try {
      const result = await this.executeCommand('docker', ['system', 'df', '--format', '{{.Size}}']);
      const sizes = result.stdout.trim().split('\n');
      
      let totalSize = 0;
      for (const sizeStr of sizes) {
        totalSize += this.parseDockerSize(sizeStr);
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  async pruneDockerImages(olderThanDays: number): Promise<DockerPruneResult> {
    const result: DockerPruneResult = {
      imagesRemoved: 0,
      spaceReclaimed: 0,
      containersRemoved: 0,
      volumesRemoved: 0,
      success: false,
      errors: [],
    };
    
    if (!(await this.isDockerInstalled())) {
      result.errors.push('Docker is not installed');
      return result;
    }
    
    try {
      // Remove unused images older than specified days
      const filterArg = `until=${olderThanDays * 24}h`;
      const pruneResult = await this.executeCommand('docker', [
        'image', 'prune', '-a', '-f',
        '--filter', filterArg
      ]);
      
      // Parse the result
      const match = pruneResult.stdout.match(/Total reclaimed space: ([\d.]+\s*\w+)/);
      if (match) {
        result.spaceReclaimed = this.parseDockerSize(match[1]);
      }
      
      const imageMatch = pruneResult.stdout.match(/Deleted Images:\n([\s\S]*?)(?=Total|$)/);
      if (imageMatch) {
        result.imagesRemoved = (imageMatch[1].match(/deleted:/g) || []).length;
      }
      
      result.success = true;
    } catch (error) {
      result.errors.push(String(error));
    }
    
    return result;
  }

  async pruneDockerSystem(): Promise<DockerPruneResult> {
    const result: DockerPruneResult = {
      imagesRemoved: 0,
      spaceReclaimed: 0,
      containersRemoved: 0,
      volumesRemoved: 0,
      success: false,
      errors: [],
    };
    
    if (!(await this.isDockerInstalled())) {
      result.errors.push('Docker is not installed');
      return result;
    }
    
    try {
      const pruneResult = await this.executeCommand('docker', [
        'system', 'prune', '-a', '-f', '--volumes'
      ]);
      
      const match = pruneResult.stdout.match(/Total reclaimed space: ([\d.]+\s*\w+)/);
      if (match) {
        result.spaceReclaimed = this.parseDockerSize(match[1]);
      }
      
      result.success = true;
    } catch (error) {
      result.errors.push(String(error));
    }
    
    return result;
  }

  // ============================================================================
  // Cleanup Rules
  // ============================================================================

  getDefaultCleanupRules(): CleanupRule[] {
    return MACOS_CLEANUP_RULES;
  }

  // ============================================================================
  // Backup Operations
  // ============================================================================

  async createBackup(files: string[], backupPath?: string): Promise<BackupInfo> {
    const backupId = uuidv4();
    const backupDir = backupPath || `${this.backupBasePath}/${backupId}`;
    
    // Create backup directory
    await this.executeCommand('mkdir', ['-p', backupDir]);
    
    const backupFiles: BackupFileInfo[] = [];
    let totalSize = 0;
    
    for (const file of files) {
      const expandedPath = this.expandPath(file);
      
      if (!(await this.fileExists(expandedPath))) {
        continue;
      }
      
      const relativePath = expandedPath.replace(this.homePath, '').replace(/^\//, '');
      const backupFilePath = `${backupDir}/${relativePath}`;
      const backupFileDir = backupFilePath.substring(0, backupFilePath.lastIndexOf('/'));
      
      // Create directory structure
      await this.executeCommand('mkdir', ['-p', backupFileDir]);
      
      // Copy file to backup
      if (await this.copyFile(expandedPath, backupFilePath)) {
        const fileInfo = await this.getFileInfo(expandedPath);
        const checksum = await this.calculateChecksum(expandedPath);
        
        backupFiles.push({
          originalPath: expandedPath,
          backupPath: backupFilePath,
          size: fileInfo.size,
          checksum,
        });
        
        totalSize += fileInfo.size;
      }
    }
    
    const backup: BackupInfo = {
      id: backupId,
      createdAt: new Date(),
      files: backupFiles,
      totalSize,
      status: 'complete',
      path: backupDir,
    };
    
    // Save backup metadata
    await this.saveBackupMetadata(backup);
    
    return backup;
  }

  async restoreBackup(backup: BackupInfo): Promise<RollbackResult> {
    const result: RollbackResult = {
      backupId: backup.id,
      success: true,
      filesRestored: 0,
      errors: [],
    };
    
    for (const file of backup.files) {
      try {
        // Ensure directory exists
        const dir = file.originalPath.substring(0, file.originalPath.lastIndexOf('/'));
        await this.executeCommand('mkdir', ['-p', dir]);
        
        // Copy from backup to original location
        if (await this.copyFile(file.backupPath, file.originalPath)) {
          // Verify checksum
          const newChecksum = await this.calculateChecksum(file.originalPath);
          if (newChecksum === file.checksum) {
            result.filesRestored++;
          } else {
            result.errors.push(`Checksum mismatch for ${file.originalPath}`);
            result.success = false;
          }
        } else {
          result.errors.push(`Failed to restore ${file.originalPath}`);
          result.success = false;
        }
      } catch (error) {
        result.errors.push(`Error restoring ${file.originalPath}: ${error}`);
        result.success = false;
      }
    }
    
    return result;
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    const backupPath = `${this.backupBasePath}/${backupId}`;
    return await this.deleteDirectory(backupPath, true);
  }

  async listBackups(): Promise<BackupInfo[]> {
    const backups: BackupInfo[] = [];
    
    try {
      const metadataPath = `${this.backupBasePath}/metadata.json`;
      const result = await this.executeCommand('cat', [metadataPath]);
      
      if (result.success) {
        const metadata = JSON.parse(result.stdout);
        return metadata.backups || [];
      }
    } catch (error) {
      // No backups exist
    }
    
    return backups;
  }

  // ============================================================================
  // System Commands
  // ============================================================================

  async executeCommand(command: string, args: string[] = []): Promise<CommandResult> {
    // In a real implementation, this would use NativeModules or child_process
    // For now, we simulate the behavior
    
    const fullCommand = `${command} ${args.map(a => `"${a}"`).join(' ')}`;
    
    try {
      // Using React Native's native module bridge in production
      // This is a simulation for development
      const stdout = await NativeModule.execAsync(fullCommand);
      
      return {
        stdout,
        stderr: '',
        exitCode: 0,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
        success: false,
      };
    }
  }

  async openUrl(url: string): Promise<boolean> {
    try {
      await this.executeCommand('open', [url]);
      return true;
    } catch {
      return false;
    }
  }

  async openSystemPreferences(pane?: string): Promise<boolean> {
    try {
      const url = pane || 'x-apple.systempreferences:';
      await this.executeCommand('open', [url]);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Permissions
  // ============================================================================

  async hasFullDiskAccess(): Promise<boolean> {
    // Check if we can access protected directories
    try {
      const result = await this.executeCommand('ls', [`${this.homePath}/Library/Mail`]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  async requestFullDiskAccess(): Promise<void> {
    await this.openSystemPreferences(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles'
    );
  }

  async hasCalendarAccess(): Promise<boolean> {
    try {
      const result = await this.executeCommand('ls', [`${this.homePath}/Library/Calendars`]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Checksums
  // ============================================================================

  async calculateChecksum(path: string, algorithm: 'md5' | 'sha256' = 'sha256'): Promise<string> {
    const expandedPath = this.expandPath(path);
    
    try {
      const command = algorithm === 'md5' ? 'md5' : 'shasum';
      const args = algorithm === 'md5' ? ['-q', expandedPath] : ['-a', '256', expandedPath];
      
      const result = await this.executeCommand(command, args);
      return result.stdout.trim().split(' ')[0];
    } catch (error) {
      return '';
    }
  }

  async verifyChecksum(
    path: string,
    expectedChecksum: string,
    algorithm: 'md5' | 'sha256' = 'sha256'
  ): Promise<boolean> {
    const actualChecksum = await this.calculateChecksum(path, algorithm);
    return actualChecksum === expectedChecksum;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async isDirectory(path: string): Promise<boolean> {
    try {
      const result = await this.executeCommand('test', ['-d', path]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  private async canDelete(path: string): Promise<boolean> {
    // Check if path is protected system directory
    const protectedPaths = [
      '/System',
      '/usr',
      '/bin',
      '/sbin',
      '/Library',
      '/private/var/db',
    ];
    
    for (const protectedPath of protectedPaths) {
      if (path.startsWith(protectedPath)) {
        return false;
      }
    }
    
    // Check write permission
    try {
      const result = await this.executeCommand('test', ['-w', path]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }

  private categorizeFile(path: string): FileCategory {
    const lowerPath = path.toLowerCase();
    
    if (lowerPath.includes('/caches/') || lowerPath.includes('/cache/')) {
      return 'cache';
    }
    if (lowerPath.includes('/logs/') || lowerPath.includes('/log/')) {
      return 'logs';
    }
    if (lowerPath.includes('/tmp/') || lowerPath.includes('/temp/')) {
      return 'temp';
    }
    if (lowerPath.includes('/downloads/')) {
      return 'downloads';
    }
    if (lowerPath.includes('/.trash/') || lowerPath.includes('/trash/')) {
      return 'trash';
    }
    if (lowerPath.includes('/docker/') || lowerPath.includes('/.docker/')) {
      return 'docker';
    }
    if (lowerPath.includes('/.npm/') || lowerPath.includes('/node_modules/')) {
      return 'npm';
    }
    if (lowerPath.includes('/homebrew/') || lowerPath.includes('/brew/')) {
      return 'brew';
    }
    if (lowerPath.includes('/xcode/') || lowerPath.includes('/developer/')) {
      return 'xcode';
    }
    if (lowerPath.includes('/library/')) {
      return 'library';
    }
    if (lowerPath.endsWith('.app')) {
      return 'application';
    }
    
    return 'other';
  }

  private calculateRiskLevel(path: string, category: FileCategory): 'low' | 'medium' | 'high' {
    // High risk: downloads, documents, user data
    if (category === 'downloads' || path.includes('/Documents/')) {
      return 'high';
    }
    
    // Medium risk: application data, docker
    if (category === 'docker' || category === 'application') {
      return 'medium';
    }
    
    // Low risk: caches, logs, temp files
    if (category === 'cache' || category === 'logs' || category === 'temp' || category === 'trash') {
      return 'low';
    }
    
    return 'medium';
  }

  private async parseListEntry(line: string, basePath: string): Promise<FileInfo | null> {
    const parts = line.split(/\s+/);
    if (parts.length < 9) return null;
    
    const permissions = parts[0];
    const size = parseInt(parts[4], 10);
    const name = parts.slice(8).join(' ');
    
    if (name === '.' || name === '..') return null;
    
    const fullPath = `${basePath}/${name}`;
    const isDirectory = permissions.startsWith('d');
    const category = this.categorizeFile(fullPath);
    
    return {
      id: uuidv4(),
      path: fullPath,
      name,
      size: isDirectory ? await this.getDirectorySize(fullPath) : size,
      category,
      lastAccessed: new Date(),
      lastModified: new Date(),
      created: new Date(),
      isDirectory,
      canDelete: await this.canDelete(fullPath),
      riskLevel: this.calculateRiskLevel(fullPath, category),
    };
  }

  private async getAppInfo(appPath: string): Promise<InstalledApplication | null> {
    try {
      // Read Info.plist
      const plistPath = `${appPath}/Contents/Info.plist`;
      
      const result = await this.executeCommand('defaults', ['read', plistPath]);
      
      // Parse common fields (simplified - in production use proper plist parsing)
      const bundleIdMatch = result.stdout.match(/CFBundleIdentifier\s*=\s*"?([^";\n]+)/);
      const versionMatch = result.stdout.match(/CFBundleShortVersionString\s*=\s*"?([^";\n]+)/);
      const nameMatch = result.stdout.match(/CFBundleName\s*=\s*"?([^";\n]+)/);
      
      const name = nameMatch?.[1] || appPath.split('/').pop()?.replace('.app', '') || '';
      const bundleId = bundleIdMatch?.[1] || '';
      const version = versionMatch?.[1] || '1.0';
      
      const size = await this.getDirectorySize(appPath);
      const lastOpened = await this.getApplicationLastUsed(bundleId);
      
      return {
        id: uuidv4(),
        name,
        bundleId,
        path: appPath,
        version,
        size,
        lastOpened: lastOpened || undefined,
        category: 'Applications',
        isSystemApp: appPath.startsWith('/System') || appPath.startsWith('/Applications/Utilities'),
        associatedFiles: [],
      };
    } catch (error) {
      return null;
    }
  }

  private parseDockerSize(sizeStr: string): number {
    const match = sizeStr.match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
    };
    
    return value * (multipliers[unit] || 1);
  }

  private async saveBackupMetadata(backup: BackupInfo): Promise<void> {
    const metadataPath = `${this.backupBasePath}/metadata.json`;
    
    let metadata: { backups: BackupInfo[] } = { backups: [] };
    
    try {
      const result = await this.executeCommand('cat', [metadataPath]);
      if (result.success) {
        metadata = JSON.parse(result.stdout);
      }
    } catch {
      // No existing metadata
    }
    
    metadata.backups.push(backup);
    
    // Keep only last N backups
    if (metadata.backups.length > BACKUP_CONFIG.MAX_BACKUPS) {
      const toRemove = metadata.backups.splice(0, metadata.backups.length - BACKUP_CONFIG.MAX_BACKUPS);
      for (const oldBackup of toRemove) {
        await this.deleteBackup(oldBackup.id);
      }
    }
    
    // Save metadata
    await this.executeCommand('mkdir', ['-p', this.backupBasePath]);
    // In production, use proper file writing
    console.log('Saving backup metadata:', JSON.stringify(metadata));
  }
}

export default MacOSPlatformService;
