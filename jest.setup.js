/**
 * Jest setup for SpaceSaver
 */

// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
      MacOSBridge: {
        execSync: jest.fn(() => ''),
        execAsync: jest.fn(() => Promise.resolve('')),
      },
    },
    Platform: {
      OS: 'macos',
      select: (/** @type {Record<string, unknown>} */ obj) => obj.macos || obj.default,
    },
  };
});

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers
jest.useFakeTimers();
