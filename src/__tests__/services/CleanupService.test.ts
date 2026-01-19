/**
 * SpaceSaver - Cleanup Service Tests
 */

import { CleanupService } from '../../services/CleanupService';
import { CleanupTarget, FileInfo, CleanupRule } from '../../types';

describe('CleanupService', () => {
  let cleanupService: CleanupService;

  beforeEach(() => {
    cleanupService = new CleanupService();
  });

  const createMockTarget = (overrides?: Partial<CleanupTarget>): CleanupTarget => {
    const mockFile: FileInfo = {
      id: 'file-1',
      path: '/tmp/test-file',
      name: 'test-file',
      size: 1024 * 1024, // 1 MB
      category: 'cache',
      lastAccessed: new Date(),
      lastModified: new Date(),
      created: new Date(),
      isDirectory: false,
      canDelete: true,
      riskLevel: 'low',
    };

    const mockRule: CleanupRule = {
      id: 'rule-1',
      name: 'Test Rule',
      description: 'Test',
      category: 'cache',
      enabled: true,
      path: '/tmp',
      riskLevel: 'low',
    };

    return {
      id: 'target-1',
      file: mockFile,
      rule: mockRule,
      selected: true,
      reason: 'Test reason',
      ...overrides,
    };
  };

  describe('performDryRun', () => {
    it('should return dry run result without deleting files', async () => {
      const targets = [createMockTarget()];

      const result = await cleanupService.performDryRun(targets);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('targets');
      expect(result).toHaveProperty('estimatedSpaceSaved');
      expect(result).toHaveProperty('riskAssessment');
      expect(result).toHaveProperty('simulation');
      expect(result.estimatedSpaceSaved).toBe(1024 * 1024);
    });

    it('should correctly assess risk levels', async () => {
      const targets = [
        createMockTarget({ id: 'low-1', file: { ...createMockTarget().file, riskLevel: 'low' } }),
        createMockTarget({ id: 'med-1', file: { ...createMockTarget().file, riskLevel: 'medium' } }),
        createMockTarget({ id: 'high-1', file: { ...createMockTarget().file, riskLevel: 'high' } }),
      ];

      const result = await cleanupService.performDryRun(targets);

      expect(result.riskAssessment.lowRiskCount).toBe(1);
      expect(result.riskAssessment.mediumRiskCount).toBe(1);
      expect(result.riskAssessment.highRiskCount).toBe(1);
      expect(result.riskAssessment.overallRisk).toBe('high');
    });

    it('should return empty result for empty targets', async () => {
      const targets: CleanupTarget[] = [];

      const result = await cleanupService.performDryRun(targets);

      expect(result.targets).toHaveLength(0);
      expect(result.estimatedSpaceSaved).toBe(0);
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      jest.useRealTimers();
    });

    afterEach(() => {
      jest.useFakeTimers();
    });

    it('should handle dry run mode', async () => {
      const targets = [createMockTarget()];

      const result = await cleanupService.cleanup(targets, {
        createBackup: false,
        verifyDeletion: false,
        mode: 'dryRun',
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, 30000);

    it('should report progress during cleanup', async () => {
      const targets = [createMockTarget()];
      const progressCallback = jest.fn();

      await cleanupService.cleanup(targets, {
        createBackup: false,
        verifyDeletion: false,
        mode: 'dryRun',
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalled();
    }, 30000);
  });

  describe('cancelCleanup', () => {
    it('should cancel without error', () => {
      expect(() => cleanupService.cancelCleanup()).not.toThrow();
    });
  });
});
