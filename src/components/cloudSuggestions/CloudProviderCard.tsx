/**
 * SpaceSaver - CloudProviderCard Component
 * Card showing cloud storage provider details and recommendations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Card, Button } from '../common';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import { CloudStorageOption } from '../../types';
import { StorageRecommendation, cloudStorageService } from '../../services';

interface CloudProviderCardProps {
  provider: CloudStorageOption;
  recommendation?: StorageRecommendation;
  storageNeeded?: number;
  onInstall: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export const CloudProviderCard: React.FC<CloudProviderCardProps> = ({
  provider,
  recommendation,
  storageNeeded = 0,
  onInstall,
  expanded = false,
  onToggleExpand,
}) => {
  const monthlyCost = storageNeeded > 0
    ? cloudStorageService['estimateMonthlyCost'](provider, storageNeeded)
    : 0;
  
  const score = recommendation?.score || provider.recommendation.score;
  
  const getScoreColor = (s: number) => {
    if (s >= 85) return COLORS.success;
    if (s >= 70) return COLORS.warning;
    return COLORS.gray[400];
  };
  
  return (
    <Card
      variant="elevated"
      style={styles.container}
      padding="none"
    >
      <TouchableOpacity
        style={styles.header}
        onPress={onToggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.providerInfo}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>
              {getProviderIcon(provider.provider)}
            </Text>
          </View>
          
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.providerName}>{provider.name}</Text>
              {provider.isInstalled && (
                <View style={styles.installedBadge}>
                  <Text style={styles.installedText}>Installed</Text>
                </View>
              )}
            </View>
            <Text style={styles.providerDesc} numberOfLines={1}>
              {provider.description}
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: getScoreColor(score) }]}>
            {score}
          </Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </TouchableOpacity>
      
      {/* Quick info row */}
      <View style={styles.quickInfo}>
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>
            {provider.pricing.freeStorageGB > 0 
              ? `${provider.pricing.freeStorageGB} GB`
              : 'None'
            }
          </Text>
          <Text style={styles.infoLabel}>Free Storage</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>
            ${provider.pricing.pricePerGBMonth.toFixed(3)}
          </Text>
          <Text style={styles.infoLabel}>Per GB/mo</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoValue}>
            {provider.security.encryption.toUpperCase()}
          </Text>
          <Text style={styles.infoLabel}>Encryption</Text>
        </View>
        {storageNeeded > 0 && (
          <>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={[styles.infoValue, styles.costValue]}>
                ${monthlyCost.toFixed(2)}
              </Text>
              <Text style={styles.infoLabel}>Est. Cost/mo</Text>
            </View>
          </>
        )}
      </View>
      
      {/* Expanded details */}
      {expanded && (
        <View style={styles.details}>
          {/* Recommendation reason */}
          {recommendation && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonTitle}>Why this provider?</Text>
              <Text style={styles.reasonText}>{recommendation.reason}</Text>
              <View style={styles.matchedCriteria}>
                {recommendation.matchedCriteria.slice(0, 3).map((criteria, idx) => (
                  <View key={idx} style={styles.criteriaChip}>
                    <Text style={styles.criteriaText}>✓ {criteria}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              {provider.features.slice(0, 4).map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Text style={styles.featureText}>• {feature}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Security */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.securityGrid}>
              <View style={styles.securityItem}>
                <Text style={styles.securityIcon}>
                  {provider.security.zeroKnowledge ? '✓' : '✗'}
                </Text>
                <Text style={styles.securityLabel}>Zero-Knowledge</Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityIcon}>
                  {provider.security.twoFactorAuth ? '✓' : '✗'}
                </Text>
                <Text style={styles.securityLabel}>2FA</Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityIcon}>
                  {provider.security.gdprCompliant ? '✓' : '✗'}
                </Text>
                <Text style={styles.securityLabel}>GDPR</Text>
              </View>
              <View style={styles.securityItem}>
                <Text style={styles.securityIcon}>
                  {provider.security.soc2Compliant ? '✓' : '✗'}
                </Text>
                <Text style={styles.securityLabel}>SOC2</Text>
              </View>
            </View>
          </View>
          
          {/* Pricing plans */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plans</Text>
            <View style={styles.plansContainer}>
              {provider.pricing.plans.slice(0, 3).map((plan, idx) => (
                <View key={idx} style={styles.planItem}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planStorage}>
                    {plan.storageGB === -1 ? 'Unlimited' : `${plan.storageGB} GB`}
                  </Text>
                  <Text style={styles.planPrice}>
                    {plan.pricePerMonth === 0 ? 'Free' : `$${plan.pricePerMonth}/mo`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Pros & Cons */}
          <View style={styles.prosConsContainer}>
            <View style={styles.prosSection}>
              <Text style={[styles.sectionTitle, styles.prosTitle]}>Pros</Text>
              {provider.recommendation.pros.map((pro, idx) => (
                <Text key={idx} style={styles.proText}>✓ {pro}</Text>
              ))}
            </View>
            <View style={styles.consSection}>
              <Text style={[styles.sectionTitle, styles.consTitle]}>Cons</Text>
              {provider.recommendation.cons.map((con, idx) => (
                <Text key={idx} style={styles.conText}>✗ {con}</Text>
              ))}
            </View>
          </View>
        </View>
      )}
      
      {/* Action button */}
      <View style={styles.actionContainer}>
        <Button
          title={provider.isInstalled ? 'Already Installed' : 'Install Now'}
          onPress={onInstall}
          disabled={provider.isInstalled}
          variant={provider.isInstalled ? 'ghost' : 'primary'}
          fullWidth
        />
      </View>
    </Card>
  );
};

const getProviderIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    icloud: '☁️',
    dropbox: '📦',
    google_drive: '🗂',
    onedrive: '☁️',
    backblaze: '🔐',
    wasabi: '🌊',
    amazon_s3: '📂',
  };
  return icons[provider] || '☁️';
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  providerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconEmoji: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  providerName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  installedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.success + '20',
    borderRadius: 4,
  },
  installedText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  providerDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  scoreContainer: {
    alignItems: 'center',
    minWidth: 50,
  },
  score: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
  },
  quickInfo: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  costValue: {
    color: COLORS.primary,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: SPACING.xs,
  },
  details: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  reasonBox: {
    padding: SPACING.md,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  reasonTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  reasonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.light,
  },
  matchedCriteria: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  criteriaChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.success + '20',
    borderRadius: 4,
  },
  criteriaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    width: '50%',
    paddingVertical: 2,
  },
  featureText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.light,
  },
  securityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  securityItem: {
    alignItems: 'center',
  },
  securityIcon: {
    fontSize: FONT_SIZES.lg,
    marginBottom: 2,
  },
  securityLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
  },
  plansContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  planItem: {
    flex: 1,
    padding: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    alignItems: 'center',
  },
  planName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text.light,
  },
  planStorage: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  planPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  prosConsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  prosSection: {
    flex: 1,
  },
  consSection: {
    flex: 1,
  },
  prosTitle: {
    color: COLORS.success,
  },
  consTitle: {
    color: COLORS.danger,
  },
  proText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    marginBottom: 4,
  },
  conText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
    marginBottom: 4,
  },
  actionContainer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
});

export default CloudProviderCard;
