/**
 * Metro configuration for React Native macOS
 * https://github.com/facebook/react-native
 *
 * @format
 */

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // Include macOS-specific file extensions for platform resolution
    sourceExts: ['macos.tsx', 'macos.ts', 'macos.jsx', 'macos.js', 'tsx', 'ts', 'jsx', 'js', 'json'],
    // Platforms supported by this app
    platforms: ['macos', 'ios', 'android'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
