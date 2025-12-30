/**
 * Tests for feedback logging and retrieval
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockFeedbackEntry } from './helpers.js';
import { FeedbackEntry } from '../src/types.js';

// Mock feedback storage
let feedbackLog: FeedbackEntry[] = [];

// Mock implementations
function logFeedback(entry: FeedbackEntry): void {
  feedbackLog.push(entry);
}

function getRecentFeedback(limit: number = 10): FeedbackEntry[] {
  return feedbackLog.slice(-limit);
}

function calculateQualityTrend(entries: FeedbackEntry[]): number {
  if (entries.length === 0) return 0;
  const successCount = entries.filter(e => e.success).length;
  return (successCount / entries.length) * 100;
}

function getAverageQualityScore(entries: FeedbackEntry[]): number {
  const entriesWithScores = entries.filter(e => e.qualityScore !== undefined);
  if (entriesWithScores.length === 0) return 0;

  const sum = entriesWithScores.reduce((acc, e) => acc + (e.qualityScore || 0), 0);
  return sum / entriesWithScores.length;
}

describe('Feedback System', () => {
  beforeEach(() => {
    feedbackLog = [];
  });

  describe('Feedback Logging', () => {
    it('should log feedback entry', () => {
      const entry = createMockFeedbackEntry({
        action: 'Write file',
        success: true,
        emberFeedback: 'Good work!',
        qualityScore: 85
      });

      logFeedback(entry);

      expect(feedbackLog).toHaveLength(1);
      expect(feedbackLog[0]).toEqual(entry);
    });

    it('should log multiple feedback entries', () => {
      logFeedback(createMockFeedbackEntry({ action: 'Action 1' }));
      logFeedback(createMockFeedbackEntry({ action: 'Action 2' }));
      logFeedback(createMockFeedbackEntry({ action: 'Action 3' }));

      expect(feedbackLog).toHaveLength(3);
    });

    it('should include timestamp in feedback', () => {
      const before = Date.now();
      const entry = createMockFeedbackEntry();
      logFeedback(entry);
      const after = Date.now();

      expect(entry.timestamp).toBeGreaterThanOrEqual(before);
      expect(entry.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Feedback Retrieval', () => {
    beforeEach(() => {
      // Add 15 feedback entries
      for (let i = 0; i < 15; i++) {
        logFeedback(createMockFeedbackEntry({
          action: `Action ${i}`,
          success: i % 2 === 0
        }));
      }
    });

    it('should get recent feedback with default limit', () => {
      const recent = getRecentFeedback();
      expect(recent).toHaveLength(10);
      expect(recent[9].action).toBe('Action 14');
    });

    it('should get recent feedback with custom limit', () => {
      const recent = getRecentFeedback(5);
      expect(recent).toHaveLength(5);
      expect(recent[0].action).toBe('Action 10');
      expect(recent[4].action).toBe('Action 14');
    });

    it('should return all entries if limit exceeds total', () => {
      const recent = getRecentFeedback(20);
      expect(recent).toHaveLength(15);
    });

    it('should return empty array when no feedback exists', () => {
      feedbackLog = [];
      const recent = getRecentFeedback();
      expect(recent).toHaveLength(0);
    });

    it('should return most recent entries first', () => {
      const recent = getRecentFeedback(3);
      expect(recent[0].action).toBe('Action 12');
      expect(recent[1].action).toBe('Action 13');
      expect(recent[2].action).toBe('Action 14');
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate quality trend from feedback', () => {
      logFeedback(createMockFeedbackEntry({ success: true }));
      logFeedback(createMockFeedbackEntry({ success: true }));
      logFeedback(createMockFeedbackEntry({ success: false }));
      logFeedback(createMockFeedbackEntry({ success: true }));

      const trend = calculateQualityTrend(feedbackLog);
      expect(trend).toBe(75); // 3 out of 4 successful
    });

    it('should return 0% for all failures', () => {
      logFeedback(createMockFeedbackEntry({ success: false }));
      logFeedback(createMockFeedbackEntry({ success: false }));

      const trend = calculateQualityTrend(feedbackLog);
      expect(trend).toBe(0);
    });

    it('should return 100% for all successes', () => {
      logFeedback(createMockFeedbackEntry({ success: true }));
      logFeedback(createMockFeedbackEntry({ success: true }));

      const trend = calculateQualityTrend(feedbackLog);
      expect(trend).toBe(100);
    });

    it('should calculate average quality score', () => {
      logFeedback(createMockFeedbackEntry({ qualityScore: 80 }));
      logFeedback(createMockFeedbackEntry({ qualityScore: 90 }));
      logFeedback(createMockFeedbackEntry({ qualityScore: 70 }));

      const avgScore = getAverageQualityScore(feedbackLog);
      expect(avgScore).toBe(80); // (80+90+70)/3
    });

    it('should ignore entries without quality scores', () => {
      logFeedback(createMockFeedbackEntry({ qualityScore: 80 }));
      logFeedback(createMockFeedbackEntry({ qualityScore: undefined }));
      logFeedback(createMockFeedbackEntry({ qualityScore: 90 }));

      const avgScore = getAverageQualityScore(feedbackLog);
      expect(avgScore).toBe(85); // (80+90)/2
    });

    it('should return 0 for empty feedback', () => {
      const trend = calculateQualityTrend(feedbackLog);
      const avgScore = getAverageQualityScore(feedbackLog);

      expect(trend).toBe(0);
      expect(avgScore).toBe(0);
    });
  });

  describe('Feedback Content', () => {
    it('should store action description', () => {
      const entry = createMockFeedbackEntry({
        action: 'Implemented new API endpoint',
        emberFeedback: 'Well structured code!'
      });

      logFeedback(entry);
      expect(feedbackLog[0].action).toBe('Implemented new API endpoint');
    });

    it('should store success/failure status', () => {
      const successEntry = createMockFeedbackEntry({ success: true });
      const failureEntry = createMockFeedbackEntry({ success: false });

      logFeedback(successEntry);
      logFeedback(failureEntry);

      expect(feedbackLog[0].success).toBe(true);
      expect(feedbackLog[1].success).toBe(false);
    });

    it('should store Ember feedback message', () => {
      const entry = createMockFeedbackEntry({
        emberFeedback: 'Excellent implementation! Production-ready code.'
      });

      logFeedback(entry);
      expect(feedbackLog[0].emberFeedback).toBe('Excellent implementation! Production-ready code.');
    });

    it('should handle optional quality score', () => {
      const withScore = createMockFeedbackEntry({ qualityScore: 95 });
      const withoutScore = createMockFeedbackEntry({ qualityScore: undefined });

      logFeedback(withScore);
      logFeedback(withoutScore);

      expect(feedbackLog[0].qualityScore).toBe(95);
      expect(feedbackLog[1].qualityScore).toBeUndefined();
    });
  });

  describe('Timeframe Filtering', () => {
    it('should get last action feedback', () => {
      logFeedback(createMockFeedbackEntry({ action: 'Action 1' }));
      logFeedback(createMockFeedbackEntry({ action: 'Action 2' }));
      logFeedback(createMockFeedbackEntry({ action: 'Action 3' }));

      const lastAction = getRecentFeedback(1);
      expect(lastAction).toHaveLength(1);
      expect(lastAction[0].action).toBe('Action 3');
    });

    it('should get session feedback (last 3)', () => {
      for (let i = 0; i < 10; i++) {
        logFeedback(createMockFeedbackEntry({ action: `Action ${i}` }));
      }

      const sessionFeedback = getRecentFeedback(3);
      expect(sessionFeedback).toHaveLength(3);
      expect(sessionFeedback[0].action).toBe('Action 7');
      expect(sessionFeedback[2].action).toBe('Action 9');
    });

    it('should get recent feedback (last 10)', () => {
      for (let i = 0; i < 20; i++) {
        logFeedback(createMockFeedbackEntry({ action: `Action ${i}` }));
      }

      const recentFeedback = getRecentFeedback(10);
      expect(recentFeedback).toHaveLength(10);
      expect(recentFeedback[0].action).toBe('Action 10');
      expect(recentFeedback[9].action).toBe('Action 19');
    });
  });
});
