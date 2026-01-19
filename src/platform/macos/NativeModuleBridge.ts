/**
 * SpaceSaver - Native Module Bridge for macOS
 * 
 * This module provides the interface between React Native and native macOS APIs.
 * In production, this would be implemented as a Swift/Objective-C native module.
 * 
 * For now, this serves as the specification for the native module implementation.
 */

import { NativeModules, Platform } from 'react-native';

// Native module interface specification
interface MacOSNativeModule {
  // File System Operations
  getFileInfo(path: string): Promise<{
    size: number;
    created: number;
    modified: number;
    accessed: number;
    isDirectory: boolean;
    isSymlink: boolean;
    permissions: string;
  }>;
  
  listDirectory(path: string): Promise<string[]>;
  
  getDirectorySize(path: string): Promise<number>;
  
  deleteFile(path: string): Promise<boolean>;
  
  deleteDirectory(path: string, recursive: boolean): Promise<boolean>;
  
  moveFile(source: string, destination: string): Promise<boolean>;
  
  copyFile(source: string, destination: string): Promise<boolean>;
  
  fileExists(path: string): Promise<boolean>;
  
  createFile(path: string, size: number): Promise<boolean>;
  
  createDirectory(path: string, recursive: boolean): Promise<boolean>;
  
  // Disk Information
  getDiskInfo(): Promise<{
    totalSpace: number;
    usedSpace: number;
    freeSpace: number;
    mountPoint: string;
    fileSystem: string;
  }>;
  
  // Application Management
  getInstalledApplications(): Promise<{
    name: string;
    bundleId: string;
    path: string;
    version: string;
    icon: string;
  }[]>;
  
  getApplicationLastUsed(bundleId: string): Promise<number | null>;
  
  uninstallApplication(path: string): Promise<boolean>;
  
  openApplication(bundleId: string): Promise<boolean>;
  
  // Docker Operations
  isDockerInstalled(): Promise<boolean>;
  
  getDockerImages(): Promise<{
    id: string;
    repository: string;
    tag: string;
    size: number;
    created: number;
  }[]>;
  
  pruneDockerImages(olderThanDays: number): Promise<{
    imagesRemoved: number;
    spaceReclaimed: number;
  }>;
  
  // System Commands
  executeCommand(command: string, args: string[]): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }>;
  
  openURL(url: string): Promise<boolean>;
  
  openSystemPreferences(pane: string): Promise<boolean>;
  
  // Permissions
  hasFullDiskAccess(): Promise<boolean>;
  
  requestFullDiskAccess(): Promise<void>;
  
  // Checksums
  calculateChecksum(path: string, algorithm: string): Promise<string>;
  
  // User Directories
  getHomeDirectory(): string;
  
  getTempDirectory(): string;
  
  getApplicationSupportDirectory(): string;
  
  getCachesDirectory(): string;
}

// Get the native module (mocked for development)
const getMacOSModule = (): MacOSNativeModule => {
  if (Platform.OS === 'macos' && NativeModules.MacOSBridge) {
    return NativeModules.MacOSBridge as MacOSNativeModule;
  }
  
  // Mock implementation for development/testing
  return createMockModule();
};

// Create a mock module for development
const createMockModule = (): MacOSNativeModule => {
  const homePath = process.env.HOME || '/Users/user';
  
  return {
    async getFileInfo(path: string) {
      return {
        size: 1024,
        created: Date.now(),
        modified: Date.now(),
        accessed: Date.now(),
        isDirectory: path.endsWith('/'),
        isSymlink: false,
        permissions: 'rwxr-xr-x',
      };
    },
    
    async listDirectory(_path: string) {
      return ['file1.txt', 'file2.txt', 'directory/'];
    },
    
    async getDirectorySize(_path: string) {
      return 1024 * 1024 * 100; // 100 MB
    },
    
    async deleteFile(_path: string) {
      return true;
    },
    
    async deleteDirectory(_path: string, _recursive: boolean) {
      return true;
    },
    
    async moveFile(_source: string, _destination: string) {
      return true;
    },
    
    async copyFile(_source: string, _destination: string) {
      return true;
    },
    
    async fileExists(_path: string) {
      return true;
    },
    
    async createFile(_path: string, _size: number) {
      return true;
    },
    
    async createDirectory(_path: string, _recursive: boolean) {
      return true;
    },
    
    async getDiskInfo() {
      return {
        totalSpace: 500 * 1024 * 1024 * 1024, // 500 GB
        usedSpace: 350 * 1024 * 1024 * 1024,  // 350 GB
        freeSpace: 150 * 1024 * 1024 * 1024,  // 150 GB
        mountPoint: '/',
        fileSystem: 'apfs',
      };
    },
    
    async getInstalledApplications() {
      return [
        {
          name: 'Safari',
          bundleId: 'com.apple.Safari',
          path: '/Applications/Safari.app',
          version: '17.0',
          icon: '',
        },
        {
          name: 'Visual Studio Code',
          bundleId: 'com.microsoft.VSCode',
          path: '/Applications/Visual Studio Code.app',
          version: '1.85',
          icon: '',
        },
      ];
    },
    
    async getApplicationLastUsed(_bundleId: string) {
      return Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    },
    
    async uninstallApplication(_path: string) {
      return true;
    },
    
    async openApplication(_bundleId: string) {
      return true;
    },
    
    async isDockerInstalled() {
      return true;
    },
    
    async getDockerImages() {
      return [
        {
          id: 'abc123',
          repository: 'node',
          tag: '18-alpine',
          size: 100 * 1024 * 1024,
          created: Date.now() - 30 * 24 * 60 * 60 * 1000,
        },
      ];
    },
    
    async pruneDockerImages(_olderThanDays: number) {
      return {
        imagesRemoved: 5,
        spaceReclaimed: 500 * 1024 * 1024,
      };
    },
    
    async executeCommand(command: string, args: string[]) {
      console.log(`[Mock] Executing: ${command} ${args.join(' ')}`);
      return {
        stdout: '',
        stderr: '',
        exitCode: 0,
      };
    },
    
    async openURL(_url: string) {
      return true;
    },
    
    async openSystemPreferences(_pane: string) {
      return true;
    },
    
    async hasFullDiskAccess() {
      return true;
    },
    
    async requestFullDiskAccess() {
      // Opens system preferences
    },
    
    async calculateChecksum(_path: string, _algorithm: string) {
      return 'mockhash123456';
    },
    
    getHomeDirectory() {
      return homePath;
    },
    
    getTempDirectory() {
      return '/tmp';
    },
    
    getApplicationSupportDirectory() {
      return `${homePath}/Library/Application Support`;
    },
    
    getCachesDirectory() {
      return `${homePath}/Library/Caches`;
    },
  };
};

export const MacOSBridge = getMacOSModule();
export default MacOSBridge;
