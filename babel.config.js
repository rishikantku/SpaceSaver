module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.macos.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@store': './src/store',
          '@utils': './src/utils',
          '@types': './src/types',
          '@platform': './src/platform',
          '@constants': './src/constants',
        },
      },
    ],
  ],
};
