/**
 * SpaceSaver - Scanner Service Tests
 */

import { ScannerService } from '../../services/ScannerService';
import { CleanupRule } from '../../types';

describe('ScannerService', () => {
  let scannerService: ScannerService;

  beforeEach(() => {
    scannerService = new ScannerService();
  });

  describe('scanSystem', () => {
    it('should return valid scan result structure', async () => {
      const mockRules: CleanupRule[] = [
        {
          id: 'test-cache',
          name: 'Test Cache',
          description: 'Test cache rule',
          category: 'cache',
          enabled: true,
          path: '/tmp/test-cache',
          riskLevel: 'low',
        },
      ];

      const result = await scannerService.scanSystem(mockRules);

      expect(result).toHaveProperty('analyses');
      expect(result).toHaveProperty('targets');
      expect(result).toHaveProperty('totalScannable');
      expect(result).toHaveProperty('diskInfo');
      expect(result).toHaveProperty('duration');
      expect(Array.isArray(result.analyses)).toBe(true);
      expect(Array.isArray(result.targets)).toBe(true);
      expect(typeof result.totalScannable).toBe('number');
      expect(typeof result.duration).toBe('number');
    });

    it('should call progress callback during scan', async () => {
      const progressCallback = jest.fn();
      const mockRules: CleanupRule[] = [
        {
          id: 'test-rule',
          name: 'Test',
          description: 'Test',
          category: 'cache',
          enabled: true,
          path: '/tmp',
          riskLevel: 'low',
        },
      ];

      await scannerService.scanSystem(mockRules, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
    });

    it('should filter out disabled rules', async () => {
      const mockRules: CleanupRule[] = [
        {
          id: 'enabled-rule',
          name: 'Enabled',
          description: 'Test',
          category: 'cache',
          enabled: true,
          path: '/tmp/enabled',
          riskLevel: 'low',
        },
        {
          id: 'disabled-rule',
          name: 'Disabled',
          description: 'Test',
          category: 'cache',
          enabled: false,
          path: '/tmp/disabled',
          riskLevel: 'low',
        },
      ];

      const result = await scannerService.scanSystem(mockRules);

      // Only the enabled rule should be processed
      expect(result.analyses.length).toBeLessThanOrEqual(1);
    });
  });

  describe('cancelScan', () => {
    it('should be able to cancel a running scan', () => {
      expect(() => scannerService.cancelScan()).not.toThrow();
    });
  });

  describe('estimateScanTime', () => {
    it('should return estimated time based on rule count', () => {
      const mockRules: CleanupRule[] = [
        {
          id: 'rule-1',
          name: 'Rule 1',
          description: 'Test',
          category: 'cache',
          enabled: true,
          path: '/tmp',
          riskLevel: 'low',
        },
        {
          id: 'rule-2',
          name: 'Rule 2',
          description: 'Test',
          category: 'logs',
          enabled: true,
          path: '/var/log',
          riskLevel: 'low',
        },
        {
          id: 'rule-3',
          name: 'Rule 3',
          description: 'Test',
          category: 'temp',
          enabled: false, // Disabled
          path: '/tmp/other',
          riskLevel: 'low',
        },
      ];

      const estimate = scannerService.estimateScanTime(mockRules);

      // Should estimate based on enabled rules only (2 rules)
      expect(estimate).toBe(2000); // 1 second per rule
    });
  });
});
