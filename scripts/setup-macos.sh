#!/bin/bash
# SpaceSaver - macOS Setup Script
# Run this script on macOS to set up the development environment
# Designed for macOS 15+ on Apple Silicon M2

set -e

echo "🚀 SpaceSaver macOS Setup"
echo "========================="
echo "Designed for macOS 15 on Apple Silicon M2"
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ This script must be run on macOS"
    echo "   For other platforms, just run: npm install && npm test"
    exit 1
fi

# Check macOS version (need macOS 15+)
MACOS_VERSION=$(sw_vers -productVersion)
MACOS_MAJOR=$(echo "$MACOS_VERSION" | cut -d. -f1)
echo "📱 Detected macOS version: $MACOS_VERSION"

if [[ "$MACOS_MAJOR" -lt 15 ]]; then
    echo "⚠️  Warning: This app is designed for macOS 15 (Sequoia) or later"
    echo "   Current version: $MACOS_VERSION"
    echo "   Some features may not work correctly"
fi

# Check architecture
ARCH=$(uname -m)
echo "🖥️  Architecture: $ARCH"

if [[ "$ARCH" != "arm64" ]]; then
    echo "⚠️  Warning: This app is optimized for Apple Silicon (arm64)"
    echo "   Detected: $ARCH"
    echo "   Performance may be reduced on Intel Macs"
fi

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon
    if [[ "$ARCH" == "arm64" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew is installed"
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    brew install node
else
    NODE_VERSION=$(node -v)
    echo "✅ Node.js is installed ($NODE_VERSION)"
    
    # Check Node.js version (need 18+)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1 | tr -d 'v')
    if [[ "$NODE_MAJOR" -lt 18 ]]; then
        echo "⚠️  Warning: Node.js 18+ is recommended"
        echo "   Current version: $NODE_VERSION"
    fi
fi

# Check for CocoaPods
if ! command -v pod &> /dev/null; then
    echo "📦 Installing CocoaPods..."
    # Use brew for Apple Silicon compatibility
    brew install cocoapods
else
    POD_VERSION=$(pod --version)
    echo "✅ CocoaPods is installed ($POD_VERSION)"
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "⚠️  Xcode is not installed"
    echo "   Please install Xcode 16+ from the App Store"
    echo "   Then run: sudo xcode-select --install"
    exit 1
else
    XCODE_VERSION=$(xcodebuild -version | head -1)
    echo "✅ $XCODE_VERSION"
    
    # Check Xcode version (need 16+ for macOS 15 SDK)
    XCODE_MAJOR=$(echo "$XCODE_VERSION" | grep -oE '[0-9]+' | head -1)
    if [[ "$XCODE_MAJOR" -lt 16 ]]; then
        echo "⚠️  Warning: Xcode 16+ is recommended for macOS 15 development"
        echo "   Current version: $XCODE_VERSION"
    fi
fi

# Check for Xcode Command Line Tools
if ! xcode-select -p &> /dev/null; then
    echo "📦 Installing Xcode Command Line Tools..."
    xcode-select --install
    echo "⏳ Please complete the Command Line Tools installation and run this script again"
    exit 1
fi

# Accept Xcode license if needed
if ! sudo xcodebuild -license check &> /dev/null 2>&1; then
    echo "📝 Accepting Xcode license..."
    sudo xcodebuild -license accept
fi

# Install npm dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# Create macos directory structure if it doesn't exist
if [ ! -d "macos" ]; then
    echo "📁 Creating macOS project structure..."
    mkdir -p macos
fi

# Initialize React Native macOS if .xcworkspace doesn't exist
if [ ! -d "macos/SpaceSaverApp.xcworkspace" ] && [ ! -f "macos/SpaceSaverApp.xcodeproj/project.pbxproj" ]; then
    echo "🔧 Initializing React Native macOS project..."
    npx react-native-macos-init --version 0.77.0
fi

# Check if Podfile exists
if [ -f "macos/Podfile" ]; then
    echo "📦 Installing CocoaPods dependencies..."
    cd macos
    
    # Clear CocoaPods cache if needed
    if [ -d "Pods" ]; then
        echo "🧹 Cleaning existing Pods..."
        rm -rf Pods Podfile.lock
    fi
    
    # Install pods with repo update for fresh dependencies
    pod install --repo-update
    
    cd ..
else
    echo "⚠️  No Podfile found in macos/"
    echo "   You may need to initialize the React Native macOS project first:"
    echo "   npx react-native-macos-init --version 0.77.0"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Your environment:"
echo "  • macOS: $MACOS_VERSION"
echo "  • Architecture: $ARCH"
echo "  • Node.js: $NODE_VERSION"
echo "  • CocoaPods: $POD_VERSION"
echo "  • $XCODE_VERSION"
echo ""
echo "Next steps:"
echo "  npm run typecheck  # Verify TypeScript"
echo "  npm run lint       # Check code style"  
echo "  npm test           # Run tests"
echo "  npm run macos      # Run the app"
echo ""
echo "For development:"
echo "  1. Open macos/SpaceSaverApp.xcworkspace in Xcode"
echo "  2. Select your Mac as the build target"
echo "  3. Press Cmd+R to build and run"
echo ""
