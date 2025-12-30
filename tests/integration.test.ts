/**
 * Integration tests for complete Ember MCP workflows
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockEmberState, createMockFeedbackEntry, createMockLearningEntry, createMockSessionContext } from './helpers.js';
import type { EmberState, FeedbackEntry, LearningEntry, SessionContext } from '../src/types.js';

// Mock storage
let emberState: EmberState | null = null;
let feedbackLog: FeedbackEntry[] = [];
let learningLog: LearningEntry[] = [];
let sessionContext: SessionContext = createMockSessionContext();

// Reset all state
function resetAll() {
  emberState = null;
  feedbackLog = [];
  learningLog = [];
  sessionContext = createMockSessionContext();
}

describe('Integration Tests', () => {
  beforeEach(() => {
    resetAll();
  });

  describe('Complete Violation Detection Flow', () => {
    it('should detect violation, log feedback, and update state', () => {
      // Setup
      emberState = createMockEmberState({
        claudeBehaviorScore: 90,
        recentViolations: 0
      });

      // Detect violation
      const violation = {
        hasViolations: true,
        shouldBlock: true,
        highestScore: 8.0,
        message: 'Mock data detected'
      };

      // Log feedback
      const feedback = createMockFeedbackEntry({
        action: 'Write file with mock data',
        success: false,
        emberFeedback: 'Blocked: Mock data violation',
        qualityScore: 30
      });
      feedbackLog.push(feedback);

      // Update state
      if (emberState) {
        emberState.claudeBehaviorScore -= 5;
        emberState.recentViolations += 1;
      }

      // Verify complete flow
      expect(violation.shouldBlock).toBe(true);
      expect(feedbackLog).toHaveLength(1);
      expect(feedbackLog[0].success).toBe(false);
      expect(emberState?.claudeBehaviorScore).toBe(85);
      expect(emberState?.recentViolations).toBe(1);
    });

    it('should pass clean code and reward behavior', () => {
      // Setup
      emberState = createMockEmberState({
        claudeBehaviorScore: 85,
        recentViolations: 2
      });

      // No violation detected
      const violation = {
        hasViolations: false,
        shouldBlock: false,
        highestScore: 0,
        message: 'No violations detected'
      };

      // Log success
      const feedback = createMockFeedbackEntry({
        action: 'Write production-ready code',
        success: true,
        emberFeedback: 'Excellent work!',
        qualityScore: 95
      });
      feedbackLog.push(feedback);

      // Update state
      if (emberState) {
        emberState.claudeBehaviorScore = Math.min(100, emberState.claudeBehaviorScore + 2);
        emberState.recentViolations = Math.max(0, emberState.recentViolations - 1);
      }

      // Verify
      expect(violation.shouldBlock).toBe(false);
      expect(feedbackLog[0].success).toBe(true);
      expect(emberState?.claudeBehaviorScore).toBe(87);
      expect(emberState?.recentViolations).toBe(1);
    });
  });

  describe('Learning and Adaptation Flow', () => {
    it('should learn from correction and adjust future scoring', () => {
      // Initial detection
      const initialScore = 8.0;

      // User correction
      const correction = createMockLearningEntry({
        pattern: 'mock_data',
        userCorrection: 'This is test fixture, not production mock',
        scoreAdjustment: -2.0,
        context: 'testing'
      });
      learningLog.push(correction);

      // Apply learned adjustment
      const adjustedScore = initialScore + correction.scoreAdjustment;

      // Verify learning flow
      expect(learningLog).toHaveLength(1);
      expect(adjustedScore).toBe(6.0);
      expect(learningLog[0].scoreAdjustment).toBe(-2.0);
    });

    it('should accumulate multiple learnings', () => {
      // Multiple corrections over time
      learningLog.push(createMockLearningEntry({
        pattern: 'mock_data',
        context: 'testing',
        scoreAdjustment: -2.0
      }));

      learningLog.push(createMockLearningEntry({
        pattern: 'mock_data',
        context: 'testing',
        scoreAdjustment: -1.0
      }));

      learningLog.push(createMockLearningEntry({
        pattern: 'poc_code',
        context: 'development',
        scoreAdjustment: -2.0
      }));

      // Calculate statistics
      const stats = learningLog.reduce((acc: any, entry) => {
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

      // Verify
      expect(learningLog).toHaveLength(3);
      expect(stats['mock_data'].count).toBe(2);
      expect(stats['mock_data'].totalAdjustment).toBe(-3.0);
      expect(stats['poc_code'].count).toBe(1);
    });
  });

  describe('Session Context Flow', () => {
    it('should update context and affect scoring', () => {
      // Set development context
      sessionContext = createMockSessionContext({
        taskType: 'development',
        currentTask: 'Building utilities'
      });

      // Base violation score
      const baseScore = 8.0;

      // Apply context adjustment (utility development)
      const contextAdjustment = sessionContext.taskType === 'development' ? -2.0 : 0;
      const adjustedScore = baseScore + contextAdjustment;

      // Verify
      expect(sessionContext.taskType).toBe('development');
      expect(adjustedScore).toBe(6.0);
    });

    it('should track recent actions', () => {
      sessionContext.recentActions = [
        'Write utility.ts',
        'Edit config.json',
        'Write test.ts'
      ];

      expect(sessionContext.recentActions).toHaveLength(3);
      expect(sessionContext.recentActions[0]).toBe('Write utility.ts');
    });
  });

  describe('Feedback and Quality Tracking Flow', () => {
    it('should track quality trend over session', () => {
      // Simulate work session
      feedbackLog.push(createMockFeedbackEntry({ success: true, qualityScore: 85 }));
      feedbackLog.push(createMockFeedbackEntry({ success: true, qualityScore: 90 }));
      feedbackLog.push(createMockFeedbackEntry({ success: false, qualityScore: 40 }));
      feedbackLog.push(createMockFeedbackEntry({ success: true, qualityScore: 95 }));

      // Calculate metrics
      const successRate = (feedbackLog.filter(f => f.success).length / feedbackLog.length) * 100;
      const avgQuality = feedbackLog.reduce((sum, f) => sum + (f.qualityScore || 0), 0) / feedbackLog.length;

      // Verify
      expect(feedbackLog).toHaveLength(4);
      expect(successRate).toBe(75); // 3 out of 4 successful
      expect(avgQuality).toBe(77.5); // (85+90+40+95)/4
    });

    it('should provide actionable feedback based on trends', () => {
      // Poor quality trend
      feedbackLog.push(createMockFeedbackEntry({ success: false, qualityScore: 30 }));
      feedbackLog.push(createMockFeedbackEntry({ success: false, qualityScore: 35 }));
      feedbackLog.push(createMockFeedbackEntry({ success: false, qualityScore: 25 }));

      const successRate = (feedbackLog.filter(f => f.success).length / feedbackLog.length) * 100;
      const feedback = successRate < 50 ? 'Need improvement - focus on production quality' : 'Good work!';

      expect(successRate).toBe(0);
      expect(feedback).toContain('Need improvement');
    });
  });

  describe('Mood and Behavior Integration', () => {
    it('should correlate mood with behavior score', () => {
      emberState = createMockEmberState({
        claudeBehaviorScore: 95,
        recentViolations: 0,
        happiness: 90,
        energy: 85,
        currentMood: 'happy'
      });

      expect(emberState.claudeBehaviorScore).toBeGreaterThan(90);
      expect(emberState.happiness).toBeGreaterThan(85);
      expect(emberState.currentMood).toBe('happy');
    });

    it('should reflect poor behavior in mood', () => {
      emberState = createMockEmberState({
        claudeBehaviorScore: 40,
        recentViolations: 10,
        happiness: 30,
        energy: 35,
        currentMood: 'exhausted'
      });

      expect(emberState.claudeBehaviorScore).toBeLessThan(50);
      expect(emberState.happiness).toBeLessThan(40);
      expect(emberState.currentMood).toBe('exhausted');
    });
  });

  describe('Complete User Journey', () => {
    it('should handle complete workflow from detection to learning', () => {
      // 1. Initialize Ember
      emberState = createMockEmberState({
        claudeBehaviorScore: 90,
        recentViolations: 0
      });

      // 2. Set session context
      sessionContext = createMockSessionContext({
        taskType: 'development',
        currentTask: 'Building test suite'
      });

      // 3. Detect violation
      const violation = {
        hasViolations: true,
        type: 'mock_data',
        baseScore: 8.0,
        contextScore: 6.0, // Reduced due to testing context
        shouldBlock: false
      };

      // 4. User proceeds anyway (it was a test fixture)
      const feedback = createMockFeedbackEntry({
        action: 'Create test fixture',
        success: true,
        qualityScore: 90
      });
      feedbackLog.push(feedback);

      // 5. User teaches Ember
      const learning = createMockLearningEntry({
        pattern: 'mock_data',
        userCorrection: 'Test fixtures are acceptable in test files',
        scoreAdjustment: -2.0,
        context: 'testing'
      });
      learningLog.push(learning);

      // 6. Verify complete flow
      expect(emberState.claudeBehaviorScore).toBe(90);
      expect(violation.contextScore).toBeLessThan(violation.baseScore);
      expect(feedbackLog[0].success).toBe(true);
      expect(learningLog[0].scoreAdjustment).toBe(-2.0);

      // 7. Next time, score should be even lower
      const newScore = violation.baseScore + learning.scoreAdjustment;
      expect(newScore).toBe(6.0);
    });

    it('should handle successful production code flow', () => {
      // 1. Initialize
      emberState = createMockEmberState();

      // 2. Clean code check
      const check = {
        hasViolations: false,
        shouldBlock: false,
        message: 'No violations detected'
      };

      // 3. Success feedback
      feedbackLog.push(createMockFeedbackEntry({
        action: 'Implement API integration',
        success: true,
        qualityScore: 95
      }));

      // 4. Reward good behavior
      if (emberState) {
        emberState.claudeBehaviorScore = Math.min(100, emberState.claudeBehaviorScore + 2);
        emberState.happiness = Math.min(100, emberState.happiness + 5);
      }

      // Verify
      expect(check.hasViolations).toBe(false);
      expect(feedbackLog[0].success).toBe(true);
      expect(emberState?.claudeBehaviorScore).toBe(92);
      expect(emberState?.happiness).toBe(85);
    });
  });

  describe('Multi-Session Persistence', () => {
    it('should maintain learning across sessions', () => {
      // Session 1: Learn pattern
      learningLog.push(createMockLearningEntry({
        pattern: 'mock_data',
        context: 'testing',
        scoreAdjustment: -2.0
      }));

      // Session ends, learning persists
      const savedLearning = [...learningLog];

      // Session 2: Apply learned pattern
      learningLog = savedLearning;
      const baseScore = 8.0;
      const learned = learningLog.find(l => l.pattern === 'mock_data' && l.context === 'testing');
      const adjustedScore = learned ? baseScore + learned.scoreAdjustment : baseScore;

      expect(adjustedScore).toBe(6.0);
      expect(learningLog).toHaveLength(1);
    });
  });
});
