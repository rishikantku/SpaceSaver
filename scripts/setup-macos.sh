#!/bin/bash
# SpaceSaver - macOS Setup Script
# Run this script on macOS to set up the development environment

set -e

echo "🚀 SpaceSaver macOS Setup"
echo "========================="
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ This script must be run on macOS"
    echo "   For other platforms, just run: npm install && npm test"
    exit 1
fi

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
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
fi

# Check for CocoaPods
if ! command -v pod &> /dev/null; then
    echo "📦 Installing CocoaPods..."
    brew install cocoapods
else
    POD_VERSION=$(pod --version)
    echo "✅ CocoaPods is installed ($POD_VERSION)"
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "⚠️  Xcode is not installed"
    echo "   Please install Xcode from the App Store"
    echo "   Then run: sudo xcode-select --install"
else
    XCODE_VERSION=$(xcodebuild -version | head -1)
    echo "✅ $XCODE_VERSION"
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

# Check if Podfile exists
if [ -f "macos/Podfile" ]; then
    echo "📦 Installing CocoaPods dependencies..."
    cd macos && pod install && cd ..
else
    echo "⚠️  No Podfile found in macos/"
    echo "   You may need to initialize the React Native macOS project first:"
    echo "   npx react-native-macos-init"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  npm run typecheck  # Verify TypeScript"
echo "  npm run lint       # Check code style"  
echo "  npm test           # Run tests"
echo "  npm run macos      # Run the app"
echo ""
