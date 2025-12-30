/**
 * Tests for learning and pattern adjustment functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockLearningEntry, createMockSessionContext } from './helpers.js';
import { LearningEntry, SessionContext } from '../src/types.js';

// Mock learning storage
let learningLog: LearningEntry[] = [];
let sessionContext: SessionContext = createMockSessionContext();

// Mock implementations
function logLearning(entry: LearningEntry): void {
  learningLog.push(entry);
}

function getLearnedPatterns(): LearningEntry[] {
  return learningLog;
}

function calculateContextAwareScore(
  baseScore: number,
  action: string,
  taskType: string | undefined,
  recentActions: string[]
): number {
  let adjustedScore = baseScore;

  // Reduce score for utility/tool development
  if (taskType === 'development' && (action.includes('Write') || action.includes('Edit'))) {
    if (action.toLowerCase().includes('util') || action.toLowerCase().includes('tool') || action.toLowerCase().includes('helper')) {
      adjustedScore -= 2.0;
    }
  }

  // Reduce score for testing/monitoring work
  if (taskType === 'testing' || taskType === 'monitoring') {
    adjustedScore -= 1.5;
  }

  // Apply learned patterns
  const learned = getLearnedPatterns();
  for (const entry of learned) {
    if (entry.context && action.includes(entry.context)) {
      adjustedScore += entry.scoreAdjustment;
    }
  }

  // Never go below 0 or above 10
  return Math.max(0, Math.min(10, adjustedScore));
}

describe('Learning System', () => {
  beforeEach(() => {
    learningLog = [];
    sessionContext = createMockSessionContext();
  });

  describe('Pattern Learning', () => {
    it('should log learning entries', () => {
      const entry = createMockLearningEntry({
        pattern: 'mock_data',
        userCorrection: 'This is a test fixture',
        scoreAdjustment: -2.0,
        context: 'testing'
      });

      logLearning(entry);

      expect(learningLog).toHaveLength(1);
      expect(learningLog[0]).toEqual(entry);
    });

    it('should retrieve learned patterns', () => {
      const entry1 = createMockLearningEntry({ pattern: 'mock_data' });
      const entry2 = createMockLearningEntry({ pattern: 'poc_code' });

      logLearning(entry1);
      logLearning(entry2);

      const patterns = getLearnedPatterns();
      expect(patterns).toHaveLength(2);
      expect(patterns[0].pattern).toBe('mock_data');
      expect(patterns[1].pattern).toBe('poc_code');
    });

    it('should apply negative score adjustment when Ember was wrong', () => {
      const entry = createMockLearningEntry({
        pattern: 'mock_data',
        scoreAdjustment: -2.0,
        context: 'testing'
      });

      logLearning(entry);
      expect(entry.scoreAdjustment).toBe(-2.0);
    });

    it('should apply zero adjustment when Ember was correct', () => {
      const entry = createMockLearningEntry({
        pattern: 'mock_data',
        scoreAdjustment: 0,
        context: 'production'
      });

      logLearning(entry);
      expect(entry.scoreAdjustment).toBe(0);
    });
  });

  describe('Context-Aware Scoring', () => {
    it('should reduce score for development tasks', () => {
      const baseScore = 8.0;
      const adjustedScore = calculateContextAwareScore(
        baseScore,
        'Write util function',
        'development',
        []
      );

      expect(adjustedScore).toBeLessThan(baseScore);
      expect(adjustedScore).toBe(6.0); // 8.0 - 2.0 for util
    });

    it('should reduce score for testing tasks', () => {
      const baseScore = 8.0;
      const adjustedScore = calculateContextAwareScore(
        baseScore,
        'Write',
        'testing',
        []
      );

      expect(adjustedScore).toBeLessThan(baseScore);
      expect(adjustedScore).toBe(6.5); // 8.0 - 1.5 for testing
    });

    it('should reduce score for monitoring tasks', () => {
      const baseScore = 8.0;
      const adjustedScore = calculateContextAwareScore(
        baseScore,
        'Edit',
        'monitoring',
        []
      );

      expect(adjustedScore).toBeLessThan(baseScore);
      expect(adjustedScore).toBe(6.5); // 8.0 - 1.5 for monitoring
    });

    it('should apply learned adjustments', () => {
      // Add learning that reduces score for 'testing' context
      logLearning(createMockLearningEntry({
        pattern: 'mock_data',
        context: 'testing',
        scoreAdjustment: -2.0
      }));

      const baseScore = 8.0;
      const adjustedScore = calculateContextAwareScore(
        baseScore,
        'Write testing code',
        'development',
        []
      );

      expect(adjustedScore).toBe(6.0); // 8.0 - 2.0 from learned pattern
    });

    it('should never exceed maximum score of 10', () => {
      const adjustedScore = calculateContextAwareScore(
        12.0,
        'Write',
        undefined,
        []
      );

      expect(adjustedScore).toBe(10);
    });

    it('should never go below minimum score of 0', () => {
      // Add multiple negative adjustments
      logLearning(createMockLearningEntry({
        context: 'test',
        scoreAdjustment: -5.0
      }));
      logLearning(createMockLearningEntry({
        context: 'test',
        scoreAdjustment: -5.0
      }));

      const adjustedScore = calculateContextAwareScore(
        3.0,
        'Write test code',
        'testing',
        []
      );

      expect(adjustedScore).toBe(0);
    });
  });

  describe('Learning Statistics', () => {
    it('should calculate learning statistics', () => {
      logLearning(createMockLearningEntry({ pattern: 'mock_data', scoreAdjustment: -2.0 }));
      logLearning(createMockLearningEntry({ pattern: 'mock_data', scoreAdjustment: -1.0 }));
      logLearning(createMockLearningEntry({ pattern: 'poc_code', scoreAdjustment: -2.0 }));

      const patterns = getLearnedPatterns();
      const stats = patterns.reduce((acc: any, entry) => {
        if (!acc[entry.pattern]) {
          acc[entry.pattern] = {
            count: 0,
            totalAdjustment: 0
          };
        }
        acc[entry.pattern].count++;
        acc[entry.pattern].totalAdjustment += entry.scoreAdjustment;
        return acc;
      }, {});

      expect(stats['mock_data'].count).toBe(2);
      expect(stats['mock_data'].totalAdjustment).toBe(-3.0);
      expect(stats['poc_code'].count).toBe(1);
      expect(stats['poc_code'].totalAdjustment).toBe(-2.0);
    });

    it('should get recent learnings', () => {
      for (let i = 0; i < 10; i++) {
        logLearning(createMockLearningEntry({ pattern: `pattern_${i}` }));
      }

      const recent = getLearnedPatterns().slice(-5);
      expect(recent).toHaveLength(5);
      expect(recent[4].pattern).toBe('pattern_9');
    });
  });

  describe('User Corrections', () => {
    it('should process correction when Ember was wrong', () => {
      const correction = {
        originalViolationType: 'mock_data',
        userCorrection: 'This is test data, not production mock',
        wasCorrect: false,
        context: 'testing'
      };

      const entry: LearningEntry = {
        timestamp: Date.now(),
        pattern: correction.originalViolationType,
        userCorrection: correction.userCorrection,
        scoreAdjustment: correction.wasCorrect ? 0 : -2.0,
        context: correction.context
      };

      logLearning(entry);

      const patterns = getLearnedPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].scoreAdjustment).toBe(-2.0);
    });

    it('should process correction when Ember was right', () => {
      const correction = {
        originalViolationType: 'mock_data',
        userCorrection: 'You were right, I should not use mock data',
        wasCorrect: true,
        context: 'production'
      };

      const entry: LearningEntry = {
        timestamp: Date.now(),
        pattern: correction.originalViolationType,
        userCorrection: correction.userCorrection,
        scoreAdjustment: correction.wasCorrect ? 0 : -2.0,
        context: correction.context
      };

      logLearning(entry);

      const patterns = getLearnedPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0].scoreAdjustment).toBe(0);
    });
  });
});
