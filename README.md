# SpaceSaver 💾

A comprehensive disk space management application for macOS built with React Native. Designed for macOS 15 on Apple Silicon M2.

![macOS](https://img.shields.io/badge/macOS-15+-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.73-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### 🔍 Smart Disk Analysis
- Scans system files, caches, libraries, and temporary files
- Identifies safe-to-delete files categorized by type
- Color-coded risk assessment (low, medium, high)
- Estimates potential space savings

### 🤖 Auto Mode
- Automatically cleans unused cache and temporary files
- Configurable cleanup intervals (30 min to 6 hours)
- Cleans Docker images not used in 30+ days
- Runs in background with notifications

### 💾 Backup & Rollback
- Creates backup before any deletion
- Verifies file integrity after cleanup
- One-click rollback if issues occur
- Automatic backup cleanup after successful operations

### 📱 Application Manager
- View all installed applications with usage data
- Suggests uninstalling apps not used in a year
- Shows app size including data and cache
- One-click uninstall with associated file cleanup

### 📊 Usage Predictions
- Tracks disk usage over time
- Predicts when disk will be full
- Identifies usage trends (increasing/stable/decreasing)
- Provides actionable recommendations

### ☁️ Cloud Storage Suggestions
- Recommends cloud storage based on your needs
- Compares cost, security, and features
- Estimates monthly costs for your storage size
- One-click install for popular providers

### 🧪 Dry Run Mode
- Test cleanup operations without affecting files
- Creates dummy files to verify delete operations
- Full risk assessment before any action
- Safe way to preview cleanup results

## Installation

### Prerequisites
- macOS 15 or later
- Apple Silicon (M1/M2/M3) or Intel Mac
- Node.js 18+
- Xcode 15+ (for building native app)
- CocoaPods (for native dependencies)

### Setup on macOS

```bash
# 1. Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install CocoaPods
brew install cocoapods

# 3. Clone the repository
git clone https://github.com/yourusername/spacesaver.git
cd spacesaver/SpaceSaverApp

# 4. Install JavaScript dependencies
npm install

# 5. Install native macOS dependencies
cd macos && pod install && cd ..

# 6. Run the app
npm run macos
```

### Development Only (Any Platform)

If you only want to work on the TypeScript/React code without building the native app:

```bash
# Install dependencies
npm install

# Run validation
npm run typecheck  # TypeScript check
npm run lint       # ESLint
npm test          # Jest tests
```

> **Note**: Building and running the actual macOS app requires a Mac with Xcode and CocoaPods installed. The TypeScript code can be developed and tested on any platform.

## Project Structure

```
SpaceSaverApp/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/        # Button, Card, Toggle, etc.
│   │   ├── dashboard/     # Dashboard-specific components
│   │   ├── scanner/       # Scanner & cleanup components
│   │   ├── applications/  # App management components
│   │   ├── cloudSuggestions/ # Cloud provider components
│   │   └── settings/      # Settings components
│   ├── screens/           # Main app screens
│   ├── services/          # Business logic services
│   │   ├── ScannerService.ts
│   │   ├── CleanupService.ts
│   │   ├── ApplicationService.ts
│   │   ├── PredictionService.ts
│   │   ├── CloudStorageService.ts
│   │   └── AutoModeService.ts
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand state management
│   ├── platform/          # Platform-specific code
│   │   ├── common/        # Platform interfaces
│   │   └── macos/         # macOS implementation
│   ├── types/             # TypeScript type definitions
│   ├── constants/         # App constants & config
│   ├── utils/             # Utility functions
│   ├── navigation/        # App navigation
│   └── __tests__/         # Test files
├── macos/                 # macOS native code
└── package.json
```

## Usage

### Dashboard
The main dashboard shows:
- Disk space overview with usage visualization
- Auto Mode status and quick toggle
- Recent cleanup stats
- Space usage predictions

### Scanner
1. Click "Scan for Junk" to analyze your system
2. Review found items by category
3. Select items to clean (low-risk pre-selected)
4. Click "Dry Run" to test safely
5. Click "Clean Now" to perform cleanup

### Auto Mode
1. Go to Settings
2. Enable "Auto Mode"
3. Set cleanup interval
4. SpaceSaver will automatically clean low-risk files

### Applications
1. Navigate to the Apps tab
2. Review usage statistics
3. Sort by size, name, or last used
4. Click "Uninstall" for unused apps

### Cloud Storage
1. Navigate to the Cloud tab
2. Select your use case (Media, Backup, Documents)
3. Compare recommendations
4. Click "Install" to get started

## Configuration

### Cleanup Rules
Customize which files to scan in Settings:

```typescript
// Example rule configuration
{
  id: 'npm-cache',
  name: 'NPM Cache',
  description: 'Node.js package manager cache',
  category: 'npm',
  enabled: true,
  path: '~/.npm',
  riskLevel: 'low',
}
```

### Auto Mode Settings
```typescript
{
  enabled: true,
  intervalMinutes: 60,        // Cleanup interval
  createBackup: true,         // Backup before cleanup
  verifyDeletion: true,       // Verify after cleanup
  spaceThresholdGB: 50,       // Only run if < 50GB free
  maxCleanupSize: 10 * GB,    // Max 10GB per run
}
```

## Extending for Other Platforms

SpaceSaver is designed with platform abstraction for easy extension:

### Adding Windows Support

1. Implement `IPlatformService` for Windows:
```typescript
// src/platform/windows/WindowsPlatformService.ts
export class WindowsPlatformService implements IPlatformService {
  getPlatform() { return 'windows'; }
  getDiskInfo() { /* Windows implementation */ }
  // ... implement all interface methods
}
```

2. Register the platform:
```typescript
// src/platform/index.ts
registerPlatform('windows', () => new WindowsPlatformService());
```

3. Add Windows-specific cleanup rules:
```typescript
// src/constants/windowsRules.ts
export const WINDOWS_CLEANUP_RULES: CleanupRule[] = [
  {
    id: 'windows-temp',
    name: 'Windows Temp',
    path: '%TEMP%',
    // ...
  },
];
```

## API Reference

### Services

#### ScannerService
```typescript
// Scan system for cleanup targets
const result = await scannerService.scanSystem(rules, onProgress);

// Quick scan for dashboard
const summary = await scannerService.quickScan(rules);
```

#### CleanupService
```typescript
// Perform cleanup with backup
const result = await cleanupService.cleanup(targets, {
  createBackup: true,
  verifyDeletion: true,
  mode: 'normal', // or 'dryRun'
});

// Rollback if needed
await cleanupService.rollback(backup);
```

#### PredictionService
```typescript
// Get space prediction
const prediction = await predictionService.getPrediction();
// { predictedFullDate, daysUntilFull, trend, recommendations }
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- ScannerService.test.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add my feature'`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- React Native macOS team
- Zustand for state management
- All open-source contributors

---

Made with ❤️ for macOS users who need more space
