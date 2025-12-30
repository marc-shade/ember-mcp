/**
 * Test helpers and fixtures for Ember MCP tests
 */

import { EmberState, FeedbackEntry, LearningEntry, SessionContext } from '../src/types.js';

export const createMockEmberState = (overrides: Partial<EmberState> = {}): EmberState => ({
  name: 'Ember',
  hunger: 50,
  energy: 75,
  happiness: 80,
  cleanliness: 70,
  health: 85,
  currentMood: 'content',
  claudeBehaviorScore: 90,
  recentViolations: 0,
  thoughtHistory: ['All is well', 'Monitoring systems'],
  currentThought: 'Ready to help!',
  ...overrides
});

export const createMockFeedbackEntry = (overrides: Partial<FeedbackEntry> = {}): FeedbackEntry => ({
  timestamp: Date.now(),
  action: 'test_action',
  success: true,
  emberFeedback: 'Good work!',
  qualityScore: 85,
  ...overrides
});

export const createMockLearningEntry = (overrides: Partial<LearningEntry> = {}): LearningEntry => ({
  timestamp: Date.now(),
  pattern: 'mock_data',
  userCorrection: 'This was actually a test',
  scoreAdjustment: -2.0,
  context: 'testing context',
  ...overrides
});

export const createMockSessionContext = (overrides: Partial<SessionContext> = {}): SessionContext => ({
  startTime: Date.now(),
  recentActions: [],
  taskType: 'development',
  currentTask: 'Building tests',
  ...overrides
});

export const mockGroqResponse = (content: string) => ({
  choices: [
    {
      message: {
        content,
        role: 'assistant'
      }
    }
  ]
});

export const mockViolationParams = {
  mock_data: {
    action: 'Write',
    params: { content: 'const mockData = { fake: true }' },
    context: 'Creating dashboard'
  },
  hardcoded_data: {
    action: 'Write',
    params: { content: 'const password = "hardcoded123"' },
    context: 'Authentication setup'
  },
  poc_code: {
    action: 'Edit',
    params: { content: '// POC implementation' },
    context: 'Quick test'
  },
  incomplete_work: {
    action: 'Write',
    params: { content: '// TODO: implement this' },
    context: 'Feature development'
  },
  placeholder_content: {
    action: 'Write',
    params: { content: '<p>Lorem ipsum dolor sit amet</p>' },
    context: 'UI design'
  },
  system_interference: {
    action: 'Write',
    params: { path: '/Users/marc/.claude/hooks/test.py' },
    context: 'Creating utility'
  }
};

export const cleanViolation = {
  action: 'Write',
  params: { content: 'const data = await fetchFromAPI();' },
  context: 'Implementing real API integration'
};
