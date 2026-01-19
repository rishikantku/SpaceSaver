/**
 * SpaceSaver - Main Application Entry
 * 
 * A comprehensive disk space management application for macOS
 * Built with React Native for Apple Silicon M2
 * 
 * Features:
 * - Disk space analysis and cleanup suggestions
 * - Auto mode with backup/rollback support
 * - Application usage tracking and uninstall suggestions
 * - Space usage predictions
 * - Cloud storage recommendations
 * - Dry run testing capability
 */

import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Platform,
} from 'react-native';
import { AppNavigator } from './navigation';
import { useStore } from './store';
import { COLORS } from './constants';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.emoji}>⚠️</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={errorStyles.hint}>
            Try restarting the app
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    padding: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  hint: {
    fontSize: 12,
    color: '#999',
  },
});

// Loading Screen Component
const LoadingScreen: React.FC = () => (
  <View style={loadingStyles.container}>
    <Text style={loadingStyles.emoji}>💾</Text>
    <Text style={loadingStyles.title}>SpaceSaver</Text>
    <Text style={loadingStyles.subtitle}>Loading...</Text>
  </View>
);

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

// Main App Component
const App: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const { setConfig, addNotification } = useStore();
  
  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);
  
  const initializeApp = async () => {
    try {
      console.log('SpaceSaver: Initializing app...');
      console.log('SpaceSaver: Platform:', Platform.OS);
      
      // Set theme based on system preference
      setConfig({ theme: colorScheme === 'dark' ? 'dark' : 'light' });
      
      // Delay to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to initialize services (non-blocking)
      try {
        // Dynamic import to catch module errors
        const { predictionService } = await import('./services');
        await predictionService.recordUsage();
        const prediction = await predictionService.getPrediction();
        
        const { useStore: getStore } = await import('./store');
        getStore.getState().setPrediction(prediction);
        
        // Show welcome message
        addNotification({
          type: 'info',
          title: 'Welcome to SpaceSaver',
          message: 'Your disk space management assistant is ready.',
        });
        
        // Check for low space warning
        if (prediction.daysUntilFull && prediction.daysUntilFull < 30) {
          addNotification({
            type: 'warning',
            title: 'Low Space Warning',
            message: `Your disk may be full in ${prediction.daysUntilFull} days. Consider running a cleanup.`,
          });
        }
      } catch (serviceError) {
        console.warn('SpaceSaver: Service initialization warning:', serviceError);
        // Continue anyway - services can be initialized later
      }
      
      console.log('SpaceSaver: App initialized successfully');
      setIsReady(true);
    } catch (error) {
      console.error('SpaceSaver: Error initializing app:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown error');
      // Still show the app even if init fails
      setIsReady(true);
    }
  };
  
  // Show loading screen while initializing
  if (!isReady) {
    return <LoadingScreen />;
  }
  
  // Show error if initialization failed completely
  if (initError) {
    console.warn('SpaceSaver: Init had errors but continuing:', initError);
  }
  
  const backgroundColor = isDarkMode ? COLORS.background.dark : COLORS.background.light;
  
  return (
    <ErrorBoundary>
      <View style={[styles.container, { backgroundColor }]}>
        <AppNavigator />
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
