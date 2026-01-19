# SpaceSaver - Apple Silicon M2 Setup Guide

This guide provides detailed instructions for setting up SpaceSaver on an Apple Silicon Mac (M1/M2/M3) running macOS 15 (Sequoia).

## Prerequisites

- macOS 15.0 (Sequoia) or later
- Apple Silicon Mac (M1, M2, M3, or later)
- Xcode 16.0 or later
- Node.js 18+ (preferably installed via Homebrew)

## Quick Setup

Run the automated setup script:

```bash
./scripts/setup-macos.sh
```

## Manual Setup

### 1. Install Homebrew (Apple Silicon)

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# IMPORTANT: Add Homebrew to PATH for Apple Silicon
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

### 2. Install Node.js

```bash
brew install node
```

### 3. Install Ruby (Optional but recommended)

The system Ruby on macOS works, but a managed Ruby version is recommended:

```bash
brew install rbenv ruby-build
rbenv install 3.2.2
rbenv global 3.2.2

# Add to your shell profile
echo 'eval "$(rbenv init -)"' >> ~/.zprofile
source ~/.zprofile
```

### 4. Install CocoaPods

**Option A: Via Homebrew (Recommended for Apple Silicon)**
```bash
brew install cocoapods
```

**Option B: Via Ruby gem**
```bash
gem install cocoapods
```

### 5. Install Xcode

1. Install Xcode 16+ from the Mac App Store
2. Accept the license:
   ```bash
   sudo xcodebuild -license accept
   ```
3. Install Command Line Tools:
   ```bash
   xcode-select --install
   ```

### 6. Clone and Setup SpaceSaver

```bash
# Clone the repository
git clone https://github.com/rishikantku/SpaceSaver.git
cd SpaceSaver

# Install npm dependencies
npm install

# Initialize React Native macOS (if not already done)
npx react-native-macos-init --version 0.77.0

# Install CocoaPods dependencies
cd macos
pod install --repo-update
cd ..
```

## Common Issues and Solutions

### Issue: "pod install" fails with architecture errors

**Symptom:**
```
Error: Multiple commands produce... for architecture arm64
```

**Solution:**
```bash
cd macos

# Clean and reinstall
rm -rf Pods Podfile.lock
pod cache clean --all
pod install --repo-update
```

### Issue: CocoaPods not finding arm64 compatible pods

**Symptom:**
```
[!] The platform of the target ... is not compatible
```

**Solution:**
Ensure your Podfile has the correct architecture settings (already included in our Podfile):
```ruby
config.build_settings['ARCHS'] = 'arm64'
config.build_settings['ONLY_ACTIVE_ARCH'] = 'YES'
```

### Issue: Rosetta prompts or x86_64 errors

**Symptom:**
```
incompatible architecture (have 'x86_64', need 'arm64')
```

**Solution:**
Ensure you're running Terminal natively (not under Rosetta):
```bash
# Check current architecture
arch

# Should output: arm64
# If it shows i386 or x86_64, open Terminal.app info (Cmd+I) 
# and uncheck "Open using Rosetta"
```

### Issue: React Native Metro bundler issues

**Symptom:**
```
error: Unable to resolve module...
```

**Solution:**
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Or clean everything
rm -rf node_modules
npm cache clean --force
npm install
```

### Issue: Xcode build fails with signing errors

**Symptom:**
```
Signing for "SpaceSaverApp-macOS" requires a development team
```

**Solution:**
1. Open `macos/SpaceSaverApp.xcworkspace` in Xcode
2. Select the project in the navigator
3. Go to "Signing & Capabilities"
4. Select your development team
5. Or for development only, in the Podfile we've set:
   ```ruby
   config.build_settings['CODE_SIGN_IDENTITY'] = '-'
   config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
   ```

### Issue: Bundle install fails

**Symptom:**
```
Gem::Ext::BuildError: ERROR: Failed to build gem native extension
```

**Solution:**
```bash
# Install Ruby development headers
xcode-select --install

# For specific gem issues
bundle config build.ffi --with-cflags="-Wno-error=implicit-function-declaration"
bundle install
```

## Running the App

### Development Mode

```bash
# Start Metro bundler
npm start

# In another terminal, run the app
npm run macos
```

### Using Xcode

1. Open `macos/SpaceSaverApp.xcworkspace` in Xcode
2. Select "My Mac" as the run destination
3. Press `Cmd + R` to build and run

### Building for Release

```bash
npm run build:macos
```

Or via Xcode:
1. Select "Product" → "Archive"
2. Follow the export wizard

## Performance Tips for Apple Silicon

1. **Use native arm64 tools**: Avoid running anything under Rosetta
2. **Enable Metal**: SpaceSaver UI benefits from Metal acceleration (enabled by default on Apple Silicon)
3. **Use SSD-optimized operations**: The app is optimized for the fast NVMe storage in Apple Silicon Macs

## Verifying Your Setup

Run the validation commands:

```bash
# Check TypeScript
npm run typecheck

# Check code style
npm run lint

# Run tests
npm test

# Full validation
npm run validate
```

## Troubleshooting Command Reference

```bash
# Clean everything and start fresh
rm -rf node_modules
rm -rf macos/Pods macos/Podfile.lock
npm cache clean --force
npm install
cd macos && pod install --repo-update && cd ..

# Check architecture of running process
arch

# Check CocoaPods version
pod --version

# Check Xcode version
xcodebuild -version

# Check Node.js version
node --version

# Check npm version  
npm --version
```

## Getting Help

If you encounter issues not covered here:

1. Check the [React Native macOS documentation](https://microsoft.github.io/react-native-windows/docs/rnm-getting-started)
2. Search [GitHub Issues](https://github.com/rishikantku/SpaceSaver/issues)
3. Create a new issue with:
   - Your macOS version (`sw_vers`)
   - Xcode version (`xcodebuild -version`)
   - Node.js version (`node -v`)
   - CocoaPods version (`pod --version`)
   - Complete error output
