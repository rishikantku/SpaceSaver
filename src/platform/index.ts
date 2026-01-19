/**
 * SpaceSaver - Platform Exports
 * Central platform service management
 */

import { Platform } from '../types';
import { 
  IPlatformService, 
  registerPlatform, 
  getPlatformService,
} from './common/PlatformInterface';
import { MacOSPlatformService } from './macos/MacOSPlatformService';

// Register macOS platform
registerPlatform('macos', () => new MacOSPlatformService());

// Future: Register other platforms
// registerPlatform('windows', () => new WindowsPlatformService());
// registerPlatform('linux', () => new LinuxPlatformService());

/**
 * Get the current platform based on the environment
 */
export const detectPlatform = (): Platform => {
  // In React Native macOS, we can detect this from Platform.OS
  // For now, default to macOS since that's our target
  return 'macos';
};

/**
 * Get the platform service for the current platform
 */
export const getCurrentPlatformService = (): IPlatformService => {
  const platform = detectPlatform();
  return getPlatformService(platform);
};

// Export types and interfaces
export * from './common/PlatformInterface';
export { MacOSPlatformService };
