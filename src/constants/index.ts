/**
 * SpaceSaver - Application Constants
 * Central configuration and constant definitions
 */

import { CleanupRule, CloudStorageOption, AppConfig } from '../types';

// ============================================================================
// App Configuration Defaults
// ============================================================================

export const DEFAULT_CONFIG: AppConfig = {
  platform: 'macos',
  operationMode: 'normal',
  autoModeEnabled: false,
  autoModeInterval: 60, // 1 hour
  backupEnabled: true,
  notificationsEnabled: true,
  theme: 'system',
};

// ============================================================================
// Size Constants
// ============================================================================

export const BYTES = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024,
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ============================================================================
// Time Constants
// ============================================================================

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

// ============================================================================
// Cleanup Rules - macOS Specific
// ============================================================================

export const MACOS_CLEANUP_RULES: CleanupRule[] = [
  // System Caches
  {
    id: 'system-cache',
    name: 'System Caches',
    description: 'macOS system cache files that are safe to delete',
    category: 'cache',
    enabled: true,
    path: '~/Library/Caches',
    riskLevel: 'low',
  },
  {
    id: 'user-logs',
    name: 'User Logs',
    description: 'Application and system logs',
    category: 'logs',
    enabled: true,
    path: '~/Library/Logs',
    maxAge: 30,
    riskLevel: 'low',
  },
  {
    id: 'system-logs',
    name: 'System Logs',
    description: 'macOS system log files',
    category: 'logs',
    enabled: true,
    path: '/private/var/log',
    maxAge: 30,
    riskLevel: 'medium',
  },
  
  // Developer Tools
  {
    id: 'xcode-derived-data',
    name: 'Xcode Derived Data',
    description: 'Xcode build artifacts and derived data',
    category: 'xcode',
    enabled: true,
    path: '~/Library/Developer/Xcode/DerivedData',
    riskLevel: 'low',
  },
  {
    id: 'xcode-archives',
    name: 'Xcode Archives',
    description: 'Old Xcode archives (older than 90 days)',
    category: 'xcode',
    enabled: true,
    path: '~/Library/Developer/Xcode/Archives',
    maxAge: 90,
    riskLevel: 'medium',
  },
  {
    id: 'ios-simulators',
    name: 'iOS Simulator Data',
    description: 'iOS Simulator app data and caches',
    category: 'xcode',
    enabled: false,
    path: '~/Library/Developer/CoreSimulator/Devices',
    riskLevel: 'medium',
  },
  {
    id: 'xcode-device-support',
    name: 'Xcode Device Support',
    description: 'Device support files for old iOS versions',
    category: 'xcode',
    enabled: true,
    path: '~/Library/Developer/Xcode/iOS DeviceSupport',
    maxAge: 180,
    riskLevel: 'low',
  },
  
  // Docker
  {
    id: 'docker-images',
    name: 'Unused Docker Images',
    description: 'Docker images not used in the last 30 days',
    category: 'docker',
    enabled: true,
    path: '~/.docker',
    maxAge: 30,
    riskLevel: 'medium',
  },
  {
    id: 'docker-build-cache',
    name: 'Docker Build Cache',
    description: 'Docker builder cache',
    category: 'docker',
    enabled: true,
    path: '~/.docker/buildx',
    riskLevel: 'low',
  },
  
  // Package Managers
  {
    id: 'npm-cache',
    name: 'NPM Cache',
    description: 'Node.js package manager cache',
    category: 'npm',
    enabled: true,
    path: '~/.npm',
    riskLevel: 'low',
  },
  {
    id: 'yarn-cache',
    name: 'Yarn Cache',
    description: 'Yarn package manager cache',
    category: 'npm',
    enabled: true,
    path: '~/Library/Caches/Yarn',
    riskLevel: 'low',
  },
  {
    id: 'pnpm-cache',
    name: 'PNPM Cache',
    description: 'PNPM package manager cache',
    category: 'npm',
    enabled: true,
    path: '~/Library/pnpm/store',
    riskLevel: 'low',
  },
  {
    id: 'homebrew-cache',
    name: 'Homebrew Cache',
    description: 'Homebrew downloaded packages',
    category: 'brew',
    enabled: true,
    path: '~/Library/Caches/Homebrew',
    riskLevel: 'low',
  },
  {
    id: 'pip-cache',
    name: 'Python Pip Cache',
    description: 'Python package manager cache',
    category: 'cache',
    enabled: true,
    path: '~/Library/Caches/pip',
    riskLevel: 'low',
  },
  {
    id: 'cocoapods-cache',
    name: 'CocoaPods Cache',
    description: 'iOS dependency manager cache',
    category: 'cache',
    enabled: true,
    path: '~/Library/Caches/CocoaPods',
    riskLevel: 'low',
  },
  
  // Trash and Downloads
  {
    id: 'trash',
    name: 'Trash',
    description: 'Files in the Trash older than 30 days',
    category: 'trash',
    enabled: true,
    path: '~/.Trash',
    maxAge: 30,
    riskLevel: 'low',
  },
  {
    id: 'downloads-old',
    name: 'Old Downloads',
    description: 'Downloaded files older than 90 days',
    category: 'downloads',
    enabled: false,
    path: '~/Downloads',
    maxAge: 90,
    riskLevel: 'high',
  },
  
  // Browser Caches
  {
    id: 'chrome-cache',
    name: 'Chrome Cache',
    description: 'Google Chrome browser cache',
    category: 'cache',
    enabled: true,
    path: '~/Library/Caches/Google/Chrome',
    riskLevel: 'low',
  },
  {
    id: 'safari-cache',
    name: 'Safari Cache',
    description: 'Safari browser cache',
    category: 'cache',
    enabled: true,
    path: '~/Library/Caches/com.apple.Safari',
    riskLevel: 'low',
  },
  {
    id: 'firefox-cache',
    name: 'Firefox Cache',
    description: 'Mozilla Firefox browser cache',
    category: 'cache',
    enabled: true,
    path: '~/Library/Caches/Firefox',
    riskLevel: 'low',
  },
  
  // Temporary Files
  {
    id: 'tmp-user',
    name: 'Temporary Files',
    description: 'User temporary files',
    category: 'temp',
    enabled: true,
    path: '/tmp',
    maxAge: 7,
    riskLevel: 'low',
  },
  {
    id: 'private-var-folders',
    name: 'Private Var Folders',
    description: 'System temporary folders',
    category: 'temp',
    enabled: true,
    path: '/private/var/folders',
    maxAge: 7,
    riskLevel: 'medium',
  },
  
  // Application Specific
  {
    id: 'spotify-cache',
    name: 'Spotify Cache',
    description: 'Spotify music streaming cache',
    category: 'cache',
    enabled: true,
    path: '~/Library/Caches/com.spotify.client',
    riskLevel: 'low',
  },
  {
    id: 'slack-cache',
    name: 'Slack Cache',
    description: 'Slack application cache and data',
    category: 'cache',
    enabled: true,
    path: '~/Library/Application Support/Slack/Cache',
    riskLevel: 'low',
  },
  {
    id: 'vscode-cache',
    name: 'VS Code Cache',
    description: 'Visual Studio Code cache',
    category: 'cache',
    enabled: true,
    path: '~/Library/Application Support/Code/Cache',
    riskLevel: 'low',
  },
];

// ============================================================================
// Cloud Storage Options
// ============================================================================

export const CLOUD_STORAGE_OPTIONS: CloudStorageOption[] = [
  {
    id: 'icloud',
    provider: 'icloud',
    name: 'iCloud Drive',
    description: 'Apple\'s native cloud storage, deeply integrated with macOS',
    icon: 'icloud',
    pricing: {
      freeStorageGB: 5,
      pricePerGBMonth: 0.0099,
      plans: [
        { name: 'Free', storageGB: 5, pricePerMonth: 0, features: ['Basic sync', 'iCloud Photos'] },
        { name: 'iCloud+', storageGB: 50, pricePerMonth: 0.99, features: ['Private Relay', 'Hide My Email'] },
        { name: 'iCloud+ 200GB', storageGB: 200, pricePerMonth: 2.99, features: ['Family sharing', 'Private Relay'] },
        { name: 'iCloud+ 2TB', storageGB: 2048, pricePerMonth: 9.99, features: ['Everything in 200GB'] },
      ],
    },
    security: {
      encryption: 'aes-256',
      zeroKnowledge: false,
      twoFactorAuth: true,
      soc2Compliant: true,
      gdprCompliant: true,
    },
    features: ['Native macOS integration', 'Automatic backup', 'Family sharing', 'Photos sync'],
    installUrl: 'x-apple.systempreferences:com.apple.preferences.AppleIDPrefPane',
    isInstalled: true,
    recommendation: {
      score: 90,
      bestFor: ['Apple ecosystem users', 'Photos and videos', 'Document sync'],
      pros: ['Seamless integration', 'Automatic backup', 'Good pricing'],
      cons: ['No zero-knowledge encryption', 'Limited cross-platform'],
    },
  },
  {
    id: 'dropbox',
    provider: 'dropbox',
    name: 'Dropbox',
    description: 'Popular cross-platform cloud storage with excellent sharing features',
    icon: 'dropbox',
    pricing: {
      freeStorageGB: 2,
      pricePerGBMonth: 0.0099,
      plans: [
        { name: 'Basic', storageGB: 2, pricePerMonth: 0, features: ['File sync', 'Sharing'] },
        { name: 'Plus', storageGB: 2048, pricePerMonth: 11.99, features: ['Smart Sync', '30-day history'] },
        { name: 'Professional', storageGB: 3072, pricePerMonth: 19.99, features: ['180-day history', 'Watermarking'] },
      ],
    },
    security: {
      encryption: 'aes-256',
      zeroKnowledge: false,
      twoFactorAuth: true,
      soc2Compliant: true,
      gdprCompliant: true,
    },
    features: ['Cross-platform', 'Paper documents', 'Smart Sync', 'File requests'],
    installUrl: 'https://www.dropbox.com/install',
    appStoreUrl: 'macappstore://apps.apple.com/app/id327630330',
    isInstalled: false,
    recommendation: {
      score: 85,
      bestFor: ['Team collaboration', 'Cross-platform users', 'File sharing'],
      pros: ['Great sync', 'Wide compatibility', 'Good sharing'],
      cons: ['Limited free storage', 'Expensive plans'],
    },
  },
  {
    id: 'google_drive',
    provider: 'google_drive',
    name: 'Google Drive',
    description: 'Google\'s cloud storage with excellent integration with Google Workspace',
    icon: 'google-drive',
    pricing: {
      freeStorageGB: 15,
      pricePerGBMonth: 0.002,
      plans: [
        { name: 'Free', storageGB: 15, pricePerMonth: 0, features: ['Basic sync', 'Google Docs'] },
        { name: 'Google One 100GB', storageGB: 100, pricePerMonth: 1.99, features: ['Google VPN', 'Extra sharing'] },
        { name: 'Google One 200GB', storageGB: 200, pricePerMonth: 2.99, features: ['Family sharing'] },
        { name: 'Google One 2TB', storageGB: 2048, pricePerMonth: 9.99, features: ['Google Workspace features'] },
      ],
    },
    security: {
      encryption: 'aes-256',
      zeroKnowledge: false,
      twoFactorAuth: true,
      soc2Compliant: true,
      gdprCompliant: true,
    },
    features: ['15GB free', 'Google Docs integration', 'Photo backup', 'Offline access'],
    installUrl: 'https://www.google.com/drive/download/',
    appStoreUrl: 'macappstore://apps.apple.com/app/id507874739',
    isInstalled: false,
    recommendation: {
      score: 88,
      bestFor: ['Google users', 'Large free storage', 'Document editing'],
      pros: ['15GB free', 'Google integration', 'Affordable'],
      cons: ['Privacy concerns', 'No zero-knowledge'],
    },
  },
  {
    id: 'onedrive',
    provider: 'onedrive',
    name: 'Microsoft OneDrive',
    description: 'Microsoft\'s cloud storage with deep Office 365 integration',
    icon: 'microsoft-onedrive',
    pricing: {
      freeStorageGB: 5,
      pricePerGBMonth: 0.002,
      plans: [
        { name: 'Free', storageGB: 5, pricePerMonth: 0, features: ['Basic sync'] },
        { name: 'Microsoft 365 Basic', storageGB: 100, pricePerMonth: 1.99, features: ['Web Office'] },
        { name: 'Microsoft 365 Personal', storageGB: 1024, pricePerMonth: 6.99, features: ['Full Office suite'] },
        { name: 'Microsoft 365 Family', storageGB: 6144, pricePerMonth: 9.99, features: ['6 users', 'Full Office'] },
      ],
    },
    security: {
      encryption: 'aes-256',
      zeroKnowledge: false,
      twoFactorAuth: true,
      soc2Compliant: true,
      gdprCompliant: true,
    },
    features: ['Office integration', 'Personal Vault', 'Photo backup', 'Family sharing'],
    installUrl: 'https://www.microsoft.com/en-us/microsoft-365/onedrive/download',
    appStoreUrl: 'macappstore://apps.apple.com/app/id823766827',
    isInstalled: false,
    recommendation: {
      score: 82,
      bestFor: ['Office 365 users', 'Windows cross-use', 'Business users'],
      pros: ['Office included', 'Good value', 'Personal Vault'],
      cons: ['Sync issues on Mac', 'Learning curve'],
    },
  },
  {
    id: 'backblaze',
    provider: 'backblaze',
    name: 'Backblaze',
    description: 'Unlimited backup storage at an affordable price',
    icon: 'backup',
    pricing: {
      freeStorageGB: 0,
      pricePerGBMonth: 0.005,
      plans: [
        { name: 'Personal Backup', storageGB: -1, pricePerMonth: 7, features: ['Unlimited backup', '1 year history'] },
        { name: 'B2 Cloud Storage', storageGB: -1, pricePerMonth: 0, features: ['Pay per use', 'API access'] },
      ],
    },
    security: {
      encryption: 'aes-128',
      zeroKnowledge: true,
      twoFactorAuth: true,
      soc2Compliant: true,
      gdprCompliant: true,
    },
    features: ['Unlimited backup', 'Set and forget', 'File versioning', 'Restore by mail'],
    installUrl: 'https://www.backblaze.com/cloud-backup/download',
    isInstalled: false,
    recommendation: {
      score: 92,
      bestFor: ['Full system backup', 'Large data', 'Set and forget'],
      pros: ['Unlimited storage', 'Affordable', 'Zero-knowledge option'],
      cons: ['Not for sync', 'Slow initial backup'],
    },
  },
  {
    id: 'wasabi',
    provider: 'wasabi',
    name: 'Wasabi',
    description: 'Hot cloud storage with no egress fees, great for developers',
    icon: 'cloud',
    pricing: {
      freeStorageGB: 0,
      pricePerGBMonth: 0.0059,
      plans: [
        { name: 'Pay As You Go', storageGB: -1, pricePerMonth: 0, features: ['No egress fees', 'S3 compatible'] },
        { name: 'Reserved Capacity', storageGB: 1024, pricePerMonth: 5.99, features: ['Discounted rate', 'Guaranteed capacity'] },
      ],
    },
    security: {
      encryption: 'aes-256',
      zeroKnowledge: false,
      twoFactorAuth: true,
      soc2Compliant: true,
      gdprCompliant: true,
    },
    features: ['S3 compatible', 'No egress fees', 'Fast access', '11 nines durability'],
    installUrl: 'https://wasabi.com',
    isInstalled: false,
    recommendation: {
      score: 78,
      bestFor: ['Developers', 'Large data transfer', 'S3 compatibility'],
      pros: ['No egress fees', 'Fast', 'S3 compatible'],
      cons: ['No native app', 'Technical setup'],
    },
  },
];

// ============================================================================
// Application Inactivity Thresholds
// ============================================================================

export const APP_INACTIVITY_THRESHOLDS = {
  SUGGEST_UNINSTALL: 365, // days - suggest uninstall if not used in a year
  WARNING: 180, // days - show warning
  INACTIVE: 90, // days - considered inactive
};

// ============================================================================
// Scan Configuration
// ============================================================================

export const SCAN_CONFIG = {
  MAX_DEPTH: 10,
  BATCH_SIZE: 100,
  PROGRESS_INTERVAL: 100, // ms between progress updates
  EXCLUDED_PATHS: [
    '/System',
    '/usr',
    '/bin',
    '/sbin',
    '/private/var/db',
    '/.Spotlight-V100',
    '/.fseventsd',
  ],
};

// ============================================================================
// Backup Configuration
// ============================================================================

export const BACKUP_CONFIG = {
  BASE_PATH: '~/.spacesaver/backups',
  MAX_BACKUPS: 5,
  RETENTION_DAYS: 7,
  CHECKSUM_ALGORITHM: 'sha256',
};

// ============================================================================
// UI Constants
// ============================================================================

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
  background: {
    light: '#F5F5F7',
    dark: '#1C1C1E',
  },
  text: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  card: {
    light: '#FFFFFF',
    dark: '#2C2C2E',
  },
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F7',
    200: '#E5E5E7',
    300: '#D1D1D6',
    400: '#AEAEB2',
    500: '#8E8E93',
    600: '#636366',
    700: '#48484A',
    800: '#3A3A3C',
    900: '#1C1C1E',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};
