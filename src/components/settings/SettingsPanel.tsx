/**
 * SpaceSaver - SettingsPanel Component
 * Application settings and configuration
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, Toggle, Button } from '../common';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { useStore } from '../../store';
import { useAutoMode } from '../../hooks';
import { CleanupRule } from '../../types';

interface SettingsPanelProps {
  onRequestPermissions: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onRequestPermissions,
}) => {
  const { 
    config, 
    setConfig,
    cleanupRules,
    toggleRule,
  } = useStore();
  
  const autoMode = useAutoMode();
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Operation Mode */}
      <Card variant="elevated" title="Operation Mode" style={styles.section}>
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeOption,
              config.operationMode === 'normal' && styles.modeOptionActive,
            ]}
            onPress={() => setConfig({ operationMode: 'normal' })}
          >
            <Text style={styles.modeIcon}>⚡</Text>
            <Text style={[
              styles.modeTitle,
              config.operationMode === 'normal' && styles.modeTitleActive,
            ]}>
              Normal Mode
            </Text>
            <Text style={styles.modeDesc}>
              Files will be permanently deleted
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeOption,
              config.operationMode === 'dryRun' && styles.modeOptionActive,
            ]}
            onPress={() => setConfig({ operationMode: 'dryRun' })}
          >
            <Text style={styles.modeIcon}>🧪</Text>
            <Text style={[
              styles.modeTitle,
              config.operationMode === 'dryRun' && styles.modeTitleActive,
            ]}>
              Dry Run Mode
            </Text>
            <Text style={styles.modeDesc}>
              Simulates cleanup without deleting files
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
      
      {/* Auto Mode */}
      <Card variant="elevated" title="Auto Mode" style={styles.section}>
        <Toggle
          value={autoMode.isEnabled}
          onValueChange={() => autoMode.toggle()}
          label="Enable Auto Cleanup"
          description="Automatically clean unused files on schedule"
        />
        
        {autoMode.isEnabled && (
          <View style={styles.autoModeSettings}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Cleanup Interval</Text>
              <View style={styles.intervalOptions}>
                {[30, 60, 120, 360].map(mins => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.intervalOption,
                      autoMode.config.intervalMinutes === mins && styles.intervalOptionActive,
                    ]}
                    onPress={() => autoMode.updateConfig({ intervalMinutes: mins })}
                  >
                    <Text style={[
                      styles.intervalText,
                      autoMode.config.intervalMinutes === mins && styles.intervalTextActive,
                    ]}>
                      {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {autoMode.lastRunTime && (
              <View style={styles.autoModeInfo}>
                <Text style={styles.autoModeInfoText}>
                  Last run: {autoMode.lastRunTime.toLocaleString()}
                </Text>
                {autoMode.nextRunTime && (
                  <Text style={styles.autoModeInfoText}>
                    Next run: {autoMode.nextRunTime.toLocaleString()}
                  </Text>
                )}
              </View>
            )}
            
            <Button
              title="Run Now"
              variant="outline"
              size="small"
              onPress={autoMode.runNow}
              loading={autoMode.isRunning}
              style={styles.runNowButton}
            />
          </View>
        )}
      </Card>
      
      {/* Backup Settings */}
      <Card variant="elevated" title="Backup & Safety" style={styles.section}>
        <Toggle
          value={config.backupEnabled}
          onValueChange={(v) => setConfig({ backupEnabled: v })}
          label="Create Backup Before Cleanup"
          description="Allows rollback if something goes wrong"
        />
        
        <View style={styles.divider} />
        
        <Toggle
          value={config.notificationsEnabled}
          onValueChange={(v) => setConfig({ notificationsEnabled: v })}
          label="Enable Notifications"
          description="Get notified about cleanups and warnings"
        />
      </Card>
      
      {/* Cleanup Rules */}
      <Card variant="elevated" title="Cleanup Rules" style={styles.section}>
        <Text style={styles.rulesDescription}>
          Configure which types of files to include in scans and cleanups.
        </Text>
        
        <View style={styles.rulesList}>
          {groupRulesByCategory(cleanupRules).map(([category, rules]) => (
            <View key={category} style={styles.ruleCategory}>
              <Text style={styles.ruleCategoryTitle}>{category}</Text>
              {rules.map(rule => (
                <View key={rule.id} style={styles.ruleItem}>
                  <View style={styles.ruleInfo}>
                    <Text style={styles.ruleName}>{rule.name}</Text>
                    <Text style={styles.ruleDesc}>{rule.description}</Text>
                    <View style={styles.ruleMeta}>
                      <View style={[
                        styles.riskBadge,
                        { backgroundColor: getRiskColor(rule.riskLevel) + '20' },
                      ]}>
                        <Text style={[
                          styles.riskText,
                          { color: getRiskColor(rule.riskLevel) },
                        ]}>
                          {rule.riskLevel} risk
                        </Text>
                      </View>
                      {rule.maxAge && (
                        <Text style={styles.ruleAge}>
                          {rule.maxAge} days old
                        </Text>
                      )}
                    </View>
                  </View>
                  <Toggle
                    value={rule.enabled}
                    onValueChange={() => toggleRule(rule.id)}
                    size="small"
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      </Card>
      
      {/* Permissions */}
      <Card variant="elevated" title="Permissions" style={styles.section}>
        <Text style={styles.permissionText}>
          SpaceSaver needs Full Disk Access to scan and clean all areas of your system.
        </Text>
        
        <Button
          title="Grant Full Disk Access"
          variant="outline"
          onPress={onRequestPermissions}
          style={styles.permissionButton}
        />
      </Card>
      
      {/* About */}
      <Card variant="elevated" title="About" style={styles.section}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Platform</Text>
          <Text style={styles.aboutValue}>macOS (Apple Silicon)</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Built with</Text>
          <Text style={styles.aboutValue}>React Native</Text>
        </View>
      </Card>
    </ScrollView>
  );
};

// Helper functions
const groupRulesByCategory = (rules: CleanupRule[]): [string, CleanupRule[]][] => {
  const groups: Record<string, CleanupRule[]> = {};
  
  rules.forEach(rule => {
    const category = getCategoryLabel(rule.category);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(rule);
  });
  
  return Object.entries(groups);
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    cache: '💾 Caches',
    logs: '📝 Logs',
    temp: '🗑 Temporary Files',
    downloads: '⬇️ Downloads',
    trash: '🗑 Trash',
    docker: '🐳 Docker',
    npm: '📦 Package Managers',
    brew: '🍺 Homebrew',
    xcode: '🛠 Developer Tools',
    library: '📚 Library',
    application: '💻 Applications',
    media: '🎬 Media',
    documents: '📄 Documents',
    other: '📁 Other',
  };
  return labels[category] || '📁 Other';
};

const getRiskColor = (risk: string): string => {
  switch (risk) {
    case 'low': return COLORS.success;
    case 'medium': return COLORS.warning;
    case 'high': return COLORS.danger;
    default: return COLORS.gray[500];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.md,
  },
  
  // Mode selector
  modeSelector: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modeOption: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  modeOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  modeTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
    marginBottom: SPACING.xs,
  },
  modeTitleActive: {
    color: COLORS.primary,
  },
  modeDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  
  // Auto mode
  autoModeSettings: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.light,
  },
  intervalOptions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  intervalOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  intervalOptionActive: {
    backgroundColor: COLORS.primary,
  },
  intervalText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  intervalTextActive: {
    color: '#FFFFFF',
  },
  autoModeInfo: {
    padding: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  autoModeInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    marginBottom: 2,
  },
  runNowButton: {
    alignSelf: 'flex-start',
  },
  
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginVertical: SPACING.md,
  },
  
  // Rules
  rulesDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginBottom: SPACING.md,
  },
  rulesList: {
    gap: SPACING.lg,
  },
  ruleCategory: {
    gap: SPACING.sm,
  },
  ruleCategoryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
  },
  ruleInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  ruleName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text.light,
  },
  ruleDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  ruleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  riskBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: 4,
  },
  riskText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  ruleAge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
  },
  
  // Permissions
  permissionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  permissionButton: {
    alignSelf: 'flex-start',
  },
  
  // About
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  aboutLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  aboutValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text.light,
  },
});

export default SettingsPanel;
