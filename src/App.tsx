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

import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { AppNavigator } from './navigation';
import { useStore } from './store';
import { predictionService } from './services';
import { COLORS } from './constants';

const App: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const { setConfig, setPrediction, addNotification } = useStore();
  
  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);
  
  const initializeApp = async () => {
    try {
      // Set theme based on system preference
      setConfig({ theme: colorScheme === 'dark' ? 'dark' : 'light' });
      
      // Record initial usage and get prediction
      await predictionService.recordUsage();
      const prediction = await predictionService.getPrediction();
      setPrediction(prediction);
      
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
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };
  
  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDarkMode ? COLORS.background.dark : COLORS.background.light }
    ]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? COLORS.background.dark : COLORS.background.light}
      />
      <AppNavigator />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
