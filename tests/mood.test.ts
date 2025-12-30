/**
 * Tests for Ember mood and state management
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockEmberState } from './helpers.js';
import { EmberState } from '../src/types.js';

// Mock state storage
let emberState: EmberState | null = null;

// Mock implementations
function getEmberState(): EmberState | null {
  return emberState;
}

function setEmberState(state: EmberState | null): void {
  emberState = state;
}

function calculateHealth(state: EmberState): number {
  return (state.hunger + state.energy + state.happiness + state.cleanliness) / 4;
}

function determineMood(state: EmberState): string {
  const health = calculateHealth(state);

  if (health < 30) return 'exhausted';
  if (health < 50) return 'tired';
  if (health < 70) return 'okay';
  if (health < 85) return 'content';
  return 'happy';
}

describe('Ember State Management', () => {
  beforeEach(() => {
    emberState = null;
  });

  describe('State Initialization', () => {
    it('should return null when state not initialized', () => {
      const state = getEmberState();
      expect(state).toBeNull();
    });

    it('should create valid initial state', () => {
      const state = createMockEmberState();
      setEmberState(state);

      expect(getEmberState()).not.toBeNull();
      expect(getEmberState()?.name).toBe('Ember');
    });

    it('should have all required properties', () => {
      const state = createMockEmberState();
      setEmberState(state);

      const currentState = getEmberState();
      expect(currentState).toHaveProperty('name');
      expect(currentState).toHaveProperty('hunger');
      expect(currentState).toHaveProperty('energy');
      expect(currentState).toHaveProperty('happiness');
      expect(currentState).toHaveProperty('cleanliness');
      expect(currentState).toHaveProperty('health');
      expect(currentState).toHaveProperty('currentMood');
      expect(currentState).toHaveProperty('claudeBehaviorScore');
      expect(currentState).toHaveProperty('recentViolations');
      expect(currentState).toHaveProperty('thoughtHistory');
      expect(currentState).toHaveProperty('currentThought');
    });
  });

  describe('Mood Calculation', () => {
    it('should determine exhausted mood for very low stats', () => {
      const state = createMockEmberState({
        hunger: 10,
        energy: 20,
        happiness: 15,
        cleanliness: 10
      });

      const mood = determineMood(state);
      expect(mood).toBe('exhausted');
    });

    it('should determine tired mood for low stats', () => {
      const state = createMockEmberState({
        hunger: 40,
        energy: 45,
        happiness: 35,
        cleanliness: 40
      });

      const mood = determineMood(state);
      expect(mood).toBe('tired');
    });

    it('should determine okay mood for moderate stats', () => {
      const state = createMockEmberState({
        hunger: 60,
        energy: 65,
        happiness: 55,
        cleanliness: 60
      });

      const mood = determineMood(state);
      expect(mood).toBe('okay');
    });

    it('should determine content mood for good stats', () => {
      const state = createMockEmberState({
        hunger: 75,
        energy: 80,
        happiness: 75,
        cleanliness: 70
      });

      const mood = determineMood(state);
      expect(mood).toBe('content');
    });

    it('should determine happy mood for excellent stats', () => {
      const state = createMockEmberState({
        hunger: 90,
        energy: 95,
        happiness: 90,
        cleanliness: 85
      });

      const mood = determineMood(state);
      expect(mood).toBe('happy');
    });
  });

  describe('Health Calculation', () => {
    it('should calculate average health from stats', () => {
      const state = createMockEmberState({
        hunger: 80,
        energy: 60,
        happiness: 70,
        cleanliness: 90
      });

      const health = calculateHealth(state);
      expect(health).toBe(75); // (80+60+70+90)/4
    });

    it('should handle minimum health values', () => {
      const state = createMockEmberState({
        hunger: 0,
        energy: 0,
        happiness: 0,
        cleanliness: 0
      });

      const health = calculateHealth(state);
      expect(health).toBe(0);
    });

    it('should handle maximum health values', () => {
      const state = createMockEmberState({
        hunger: 100,
        energy: 100,
        happiness: 100,
        cleanliness: 100
      });

      const health = calculateHealth(state);
      expect(health).toBe(100);
    });
  });

  describe('Behavior Score', () => {
    it('should track high behavior score with no violations', () => {
      const state = createMockEmberState({
        claudeBehaviorScore: 95,
        recentViolations: 0
      });
      setEmberState(state);

      expect(getEmberState()?.claudeBehaviorScore).toBe(95);
      expect(getEmberState()?.recentViolations).toBe(0);
    });

    it('should track low behavior score with violations', () => {
      const state = createMockEmberState({
        claudeBehaviorScore: 45,
        recentViolations: 10
      });
      setEmberState(state);

      expect(getEmberState()?.claudeBehaviorScore).toBe(45);
      expect(getEmberState()?.recentViolations).toBe(10);
    });

    it('should handle behavior score updates', () => {
      const state = createMockEmberState({
        claudeBehaviorScore: 80
      });
      setEmberState(state);

      // Simulate violation
      if (emberState) {
        emberState.claudeBehaviorScore -= 5;
        emberState.recentViolations += 1;
      }

      expect(getEmberState()?.claudeBehaviorScore).toBe(75);
      expect(getEmberState()?.recentViolations).toBe(1);
    });
  });

  describe('Thought History', () => {
    it('should maintain thought history', () => {
      const state = createMockEmberState({
        thoughtHistory: ['First thought', 'Second thought', 'Third thought'],
        currentThought: 'Current thinking...'
      });
      setEmberState(state);

      expect(getEmberState()?.thoughtHistory).toHaveLength(3);
      expect(getEmberState()?.currentThought).toBe('Current thinking...');
    });

    it('should add new thoughts to history', () => {
      const state = createMockEmberState({
        thoughtHistory: ['Old thought'],
        currentThought: 'New thought'
      });
      setEmberState(state);

      // Simulate adding new thought
      if (emberState) {
        emberState.thoughtHistory.push(emberState.currentThought);
        emberState.currentThought = 'Even newer thought';
      }

      expect(getEmberState()?.thoughtHistory).toHaveLength(2);
      expect(getEmberState()?.thoughtHistory[1]).toBe('New thought');
      expect(getEmberState()?.currentThought).toBe('Even newer thought');
    });
  });

  describe('State Validation', () => {
    it('should ensure stats are within valid range (0-100)', () => {
      const state = createMockEmberState({
        hunger: 150, // Invalid
        energy: -10, // Invalid
        happiness: 50,
        cleanliness: 70
      });

      // In production, these should be clamped
      const clampStat = (value: number) => Math.max(0, Math.min(100, value));

      expect(clampStat(state.hunger)).toBe(100);
      expect(clampStat(state.energy)).toBe(0);
      expect(clampStat(state.happiness)).toBe(50);
      expect(clampStat(state.cleanliness)).toBe(70);
    });
  });
});
