/**
 * Type definitions for Ember MCP
 */

export interface EmberState {
  name: string;
  hunger: number;
  energy: number;
  happiness: number;
  cleanliness: number;
  health: number;
  currentMood: string;
  claudeBehaviorScore: number;
  recentViolations: number;
  thoughtHistory: string[];
  currentThought: string;
}

export interface FeedbackEntry {
  timestamp: number;
  action: string;
  success: boolean;
  emberFeedback: string;
  qualityScore?: number;
}

export interface LearningEntry {
  timestamp: number;
  pattern: string;
  userCorrection: string;
  scoreAdjustment: number;
  context: string;
}

export interface SessionContext {
  currentTask?: string;
  taskType?: 'development' | 'testing' | 'monitoring' | 'refactoring' | 'unknown';
  startTime: number;
  recentActions: string[];
}

export interface ViolationPattern {
  pattern: RegExp;
  type: string;
  baseSeverity: 'low' | 'medium' | 'high' | 'severe';
  baseScore: number;
  reason: string;
  suggestion: string;
  risk: string;
  impact: string;
  safeAlternative?: string;
}

export interface ViolationCheck {
  hasViolations: boolean;
  violations: ViolationDetail[];
  highestScore: number;
  shouldBlock: boolean;
  message: string;
}

export interface ViolationDetail {
  type: string;
  severity: string;
  baseScore: number;
  contextScore: number;
  reason: string;
  suggestion: string;
  risk: string;
  impact: string;
  safeAlternative?: string;
  shouldBlock: boolean;
}
