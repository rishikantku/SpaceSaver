/**
 * SpaceSaver - Settings Screen
 * Application configuration and settings
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { SettingsPanel } from '../components';
import { getCurrentPlatformService } from '../platform';
import { useStore } from '../store';
import { COLORS } from '../constants';

export const SettingsScreen: React.FC = () => {
  const platformService = getCurrentPlatformService();
  const { addNotification } = useStore();
  
  const handleRequestPermissions = useCallback(async () => {
    try {
      await platformService.requestFullDiskAccess();
      
      addNotification({
        type: 'info',
        title: 'Permissions',
        message: 'System Preferences has been opened. Please grant Full Disk Access to SpaceSaver.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to open System Preferences.',
      });
    }
  }, [platformService, addNotification]);
  
  return (
    <View style={styles.container}>
      <SettingsPanel onRequestPermissions={handleRequestPermissions} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.light,
  },
});

export default SettingsScreen;
