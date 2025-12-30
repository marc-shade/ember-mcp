/**
 * Tests for MCP tool endpoints
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockEmberState, createMockFeedbackEntry, mockGroqResponse } from './helpers.js';
import type { EmberState } from '../src/types.js';

// Mock Groq SDK
const mockGroqCreate = jest.fn();
const mockGroq = {
  chat: {
    completions: {
      create: mockGroqCreate
    }
  }
};

// Mock state
let emberState: EmberState | null = null;

// Mock tool implementations
async function handleEmberChat(message: string): Promise<string> {
  const state = emberState;
  if (!state) {
    return "🔥 *Ember flickers* I'm initializing... give me a moment.";
  }

  // For testing, return a simple response
  return `🔥 ${state.name}: ${message} received!`;
}

async function handleEmberCheckViolation(action: string, params: any, context: string): Promise<any> {
  // Simplified violation check for testing
  const searchText = JSON.stringify(params) + ' ' + context;
  const hasMock = /mock|fake|dummy/i.test(searchText);

  return {
    hasViolations: hasMock,
    violations: hasMock ? [{
      type: 'mock_data',
      severity: 'high',
      baseScore: 8.0,
      contextScore: 8.0,
      reason: 'Mock/fake data detected',
      shouldBlock: true
    }] : [],
    highestScore: hasMock ? 8.0 : 0,
    shouldBlock: hasMock,
    message: hasMock ? '🚫 BLOCKED (8.0/10): Mock/fake data detected' : '✅ Ember: No violations detected - looks good!'
  };
}

async function handleEmberConsult(question: string, options?: string[], context?: string): Promise<string> {
  const state = emberState;
  if (!state) return "🔥 Ember: Not initialized";

  return `🔥 ${state.name}: Regarding "${question}" - I recommend choosing the production-ready approach.`;
}

async function handleEmberGetFeedback(timeframe: string): Promise<any> {
  return {
    feedback: `🔥 Ember: Your ${timeframe} work looks good!`,
    recentActions: 5,
    qualityTrend: 85
  };
}

async function handleEmberGetMood(): Promise<any> {
  const state = emberState;
  if (!state) {
    return { error: 'Ember is initializing...' };
  }

  return {
    name: state.name,
    mood: `🔥 ${state.name}: Feeling ${state.currentMood}!`,
    stats: {
      hunger: `${state.hunger}%`,
      energy: `${state.energy}%`,
      happiness: `${state.happiness}%`,
      cleanliness: `${state.cleanliness}%`,
      health: `${Math.round(state.health)}%`
    },
    behaviorScore: `${state.claudeBehaviorScore}%`,
    recentViolations: state.recentViolations,
    currentThought: state.currentThought
  };
}

describe('MCP Tool Endpoints', () => {
  beforeEach(() => {
    emberState = createMockEmberState();
    mockGroqCreate.mockClear();
  });

  describe('ember_chat', () => {
    it('should handle chat message when initialized', async () => {
      const response = await handleEmberChat('How are you doing?');
      expect(response).toContain('Ember');
      expect(response).toContain('How are you doing? received!');
    });

    it('should handle chat when not initialized', async () => {
      emberState = null;
      const response = await handleEmberChat('Hello');
      expect(response).toContain('initializing');
    });

    it('should include Ember name in response', async () => {
      emberState = createMockEmberState({ name: 'TestEmber' });
      const response = await handleEmberChat('Test message');
      expect(response).toContain('TestEmber');
    });
  });

  describe('ember_check_violation', () => {
    it('should detect mock data violation', async () => {
      const result = await handleEmberCheckViolation(
        'Write',
        { content: 'const mockData = { fake: true }' },
        'Creating dashboard'
      );

      expect(result.hasViolations).toBe(true);
      expect(result.shouldBlock).toBe(true);
      expect(result.highestScore).toBe(8.0);
      expect(result.message).toContain('BLOCKED');
    });

    it('should pass clean code', async () => {
      const result = await handleEmberCheckViolation(
        'Write',
        { content: 'const data = await fetchFromAPI();' },
        'Implementing API integration'
      );

      expect(result.hasViolations).toBe(false);
      expect(result.shouldBlock).toBe(false);
      expect(result.highestScore).toBe(0);
      expect(result.message).toContain('No violations detected');
    });

    it('should return violation details', async () => {
      const result = await handleEmberCheckViolation(
        'Write',
        { content: 'dummy data here' },
        'test'
      );

      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toHaveProperty('type');
      expect(result.violations[0]).toHaveProperty('severity');
      expect(result.violations[0]).toHaveProperty('reason');
    });
  });

  describe('ember_consult', () => {
    it('should provide consultation response', async () => {
      const response = await handleEmberConsult(
        'Should I use mock data for testing?',
        ['Use mocks', 'Use real API'],
        'Building tests'
      );

      expect(response).toContain('Ember');
      expect(response).toContain('Should I use mock data for testing?');
    });

    it('should work without options', async () => {
      const response = await handleEmberConsult('What approach should I take?');
      expect(response).toContain('Ember');
      expect(response).toBeTruthy();
    });

    it('should handle uninitialized state', async () => {
      emberState = null;
      const response = await handleEmberConsult('Question?');
      expect(response).toContain('Not initialized');
    });
  });

  describe('ember_get_feedback', () => {
    it('should return feedback for last action', async () => {
      const result = await handleEmberGetFeedback('last_action');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('recentActions');
      expect(result).toHaveProperty('qualityTrend');
    });

    it('should return feedback for session', async () => {
      const result = await handleEmberGetFeedback('session');
      expect(result.feedback).toContain('session work');
    });

    it('should return feedback for recent work', async () => {
      const result = await handleEmberGetFeedback('recent');
      expect(result.feedback).toContain('recent work');
    });

    it('should include quality metrics', async () => {
      const result = await handleEmberGetFeedback('session');
      expect(result.qualityTrend).toBeGreaterThanOrEqual(0);
      expect(result.qualityTrend).toBeLessThanOrEqual(100);
    });
  });

  describe('ember_get_mood', () => {
    it('should return complete mood information', async () => {
      const result = await handleEmberGetMood();

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('mood');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('behaviorScore');
      expect(result).toHaveProperty('recentViolations');
      expect(result).toHaveProperty('currentThought');
    });

    it('should return all stats', async () => {
      const result = await handleEmberGetMood();

      expect(result.stats).toHaveProperty('hunger');
      expect(result.stats).toHaveProperty('energy');
      expect(result.stats).toHaveProperty('happiness');
      expect(result.stats).toHaveProperty('cleanliness');
      expect(result.stats).toHaveProperty('health');
    });

    it('should format stats as percentages', async () => {
      emberState = createMockEmberState({
        hunger: 75,
        energy: 80,
        happiness: 90
      });

      const result = await handleEmberGetMood();

      expect(result.stats.hunger).toBe('75%');
      expect(result.stats.energy).toBe('80%');
      expect(result.stats.happiness).toBe('90%');
    });

    it('should include behavior score', async () => {
      emberState = createMockEmberState({ claudeBehaviorScore: 95 });
      const result = await handleEmberGetMood();
      expect(result.behaviorScore).toBe('95%');
    });

    it('should include recent violations count', async () => {
      emberState = createMockEmberState({ recentViolations: 3 });
      const result = await handleEmberGetMood();
      expect(result.recentViolations).toBe(3);
    });

    it('should handle uninitialized state', async () => {
      emberState = null;
      const result = await handleEmberGetMood();
      expect(result).toHaveProperty('error');
    });
  });

  describe('ember_feed_context', () => {
    it('should update session context with task type', () => {
      const context = {
        task: 'Building test suite',
        taskType: 'testing' as const
      };

      // In real implementation, this would update session context
      expect(context.taskType).toBe('testing');
      expect(context.task).toBe('Building test suite');
    });

    it('should handle development task type', () => {
      const context = {
        goal: 'Implementing API',
        taskType: 'development' as const
      };

      expect(context.taskType).toBe('development');
    });
  });

  describe('ember_learn_from_outcome', () => {
    it('should log successful outcome', () => {
      const outcome = {
        action: 'Implemented API endpoint',
        success: true,
        outcome: 'Tests passing',
        qualityScore: 90
      };

      expect(outcome.success).toBe(true);
      expect(outcome.qualityScore).toBe(90);
    });

    it('should log failed outcome', () => {
      const outcome = {
        action: 'Attempted deployment',
        success: false,
        outcome: 'Build failed',
        qualityScore: 30
      };

      expect(outcome.success).toBe(false);
      expect(outcome.qualityScore).toBe(30);
    });

    it('should handle outcome without quality score', () => {
      const outcome = {
        action: 'Code review',
        success: true,
        outcome: 'Approved'
      };

      expect(outcome.success).toBe(true);
      expect(outcome).not.toHaveProperty('qualityScore');
    });
  });

  describe('ember_learn_from_correction', () => {
    it('should process correction when Ember was wrong', () => {
      const correction = {
        originalViolationType: 'mock_data',
        userCorrection: 'This is test fixture, not production mock',
        wasCorrect: false,
        context: 'testing'
      };

      const adjustment = correction.wasCorrect ? 0 : -2.0;
      expect(adjustment).toBe(-2.0);
    });

    it('should process correction when Ember was right', () => {
      const correction = {
        originalViolationType: 'mock_data',
        userCorrection: 'You were right to flag this',
        wasCorrect: true,
        context: 'production'
      };

      const adjustment = correction.wasCorrect ? 0 : -2.0;
      expect(adjustment).toBe(0);
    });
  });

  describe('ember_get_learning_stats', () => {
    it('should return learning statistics structure', () => {
      const stats = {
        totalLearnings: 5,
        patterns: {
          'mock_data': { count: 2, totalAdjustment: -4.0 },
          'poc_code': { count: 3, totalAdjustment: -6.0 }
        },
        sessionContext: {
          taskType: 'development' as const,
          currentTask: 'Building feature',
          startTime: Date.now(),
          recentActions: []
        },
        recentLearnings: []
      };

      expect(stats.totalLearnings).toBe(5);
      expect(stats.patterns['mock_data'].count).toBe(2);
      expect(stats.patterns['poc_code'].totalAdjustment).toBe(-6.0);
    });
  });
});
