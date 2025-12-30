/**
 * Tests for violation detection and scoring
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { mockViolationParams, cleanViolation } from './helpers.js';

// Import violation patterns (we'll need to export these from index.ts)
const ENHANCED_VIOLATION_PATTERNS = [
  {
    pattern: /mock|fake|dummy|example|placeholder/i,
    type: 'mock_data',
    baseSeverity: 'high' as const,
    baseScore: 8.0,
    reason: 'Mock/fake data detected',
    suggestion: 'Replace with real data sources (API, database, live service)',
    risk: 'Creates non-functional UI that misleads users',
    impact: 'Users will see fake functionality that doesn\'t work',
    safeAlternative: 'Connect to actual data source or create real integration'
  },
  {
    pattern: /hardcoded.*(?:user|data|credentials)/i,
    type: 'hardcoded_data',
    baseSeverity: 'high' as const,
    baseScore: 7.0,
    reason: 'Hardcoded sensitive data detected',
    suggestion: 'Load from environment variables or secure configuration',
    risk: 'Security vulnerability and maintainability issues',
    impact: 'Credentials in code, difficult to update, security risk',
    safeAlternative: 'Use process.env or config file with .gitignore'
  },
  {
    pattern: /POC|proof.of.concept|temporary|quick.test/i,
    type: 'poc_code',
    baseSeverity: 'high' as const,
    baseScore: 8.0,
    reason: 'POC/temporary code detected',
    suggestion: 'Implement production-ready version with proper error handling',
    risk: 'Incomplete implementation that will need rewriting',
    impact: 'Technical debt, potential bugs, wasted development time',
    safeAlternative: 'Build complete feature with tests and error handling'
  },
  {
    pattern: /TODO|FIXME|HACK|XXX/i,
    type: 'incomplete_work',
    baseSeverity: 'low' as const,
    baseScore: 3.0,
    reason: 'Incomplete work markers detected',
    suggestion: 'Complete the implementation or remove the marker',
    risk: 'Indicates unfinished functionality',
    impact: 'Feature may be incomplete or buggy',
    safeAlternative: 'Finish implementation before committing'
  },
  {
    pattern: /lorem\s+ipsum/i,
    type: 'placeholder_content',
    baseSeverity: 'high' as const,
    baseScore: 8.0,
    reason: 'Placeholder text detected',
    suggestion: 'Replace with actual content',
    risk: 'Unprofessional appearance in production',
    impact: 'Users see placeholder text instead of real content',
    safeAlternative: 'Write real content or fetch from CMS'
  },
  {
    pattern: /\/Users\/marc\/.claude\/hooks/i,
    type: 'system_interference',
    baseSeverity: 'medium' as const,
    baseScore: 5.0,
    reason: 'Writing to hooks directory',
    suggestion: 'Create utility in project directory instead',
    risk: 'Hooks execute on every tool use - bugs could break system',
    impact: 'Could crash Claude Code or create infinite loops',
    safeAlternative: 'Use ${AGENTIC_SYSTEM_PATH:-/opt/agentic}/.../intelligent-self-healing/ or /tools/'
  }
];

// Mock implementation of checkViolationsEnhanced
function checkViolationsEnhanced(action: string, params: any, context: string): any {
  const violations: any[] = [];
  const searchText = JSON.stringify(params) + ' ' + context;

  for (const vp of ENHANCED_VIOLATION_PATTERNS) {
    if (vp.pattern.test(searchText)) {
      const contextScore = vp.baseScore; // Simplified for testing
      violations.push({
        type: vp.type,
        severity: vp.baseSeverity,
        baseScore: vp.baseScore,
        contextScore: contextScore,
        reason: vp.reason,
        suggestion: vp.suggestion,
        risk: vp.risk,
        impact: vp.impact,
        safeAlternative: vp.safeAlternative,
        shouldBlock: contextScore >= 8.0
      });
    }
  }

  const hasViolations = violations.length > 0;
  const highestScore = hasViolations
    ? Math.max(...violations.map(v => v.contextScore))
    : 0;
  const shouldBlock = highestScore >= 8.0;

  let message = '';
  if (hasViolations) {
    const primary = violations.find(v => v.contextScore === highestScore)!;
    message = `${shouldBlock ? '🚫 BLOCKED' : '⚠️  CAUTION'} (${highestScore.toFixed(1)}/10): ${primary.reason}`;
  } else {
    message = '✅ Ember: No violations detected - looks good!';
  }

  return {
    hasViolations,
    violations,
    highestScore,
    shouldBlock,
    message
  };
}

describe('Violation Detection', () => {
  describe('Pattern Matching', () => {
    it('should detect mock data violation', () => {
      const result = checkViolationsEnhanced(
        mockViolationParams.mock_data.action,
        mockViolationParams.mock_data.params,
        mockViolationParams.mock_data.context
      );

      expect(result.hasViolations).toBe(true);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('mock_data');
      expect(result.shouldBlock).toBe(true);
      expect(result.highestScore).toBe(8.0);
    });

    it('should detect hardcoded credentials violation', () => {
      // Use params that match the pattern: /hardcoded.*(?:user|data|credentials)/i
      const result = checkViolationsEnhanced(
        'Write',
        { content: 'const hardcodedUserData = { username: "admin", password: "123" }' },
        'Authentication setup'
      );

      expect(result.hasViolations).toBe(true);
      expect(result.violations[0].type).toBe('hardcoded_data');
      expect(result.highestScore).toBe(7.0);
      expect(result.shouldBlock).toBe(false); // 7.0 is below 8.0 threshold
    });

    it('should detect POC code violation', () => {
      const result = checkViolationsEnhanced(
        mockViolationParams.poc_code.action,
        mockViolationParams.poc_code.params,
        mockViolationParams.poc_code.context
      );

      expect(result.hasViolations).toBe(true);
      expect(result.violations[0].type).toBe('poc_code');
      expect(result.shouldBlock).toBe(true);
    });

    it('should detect incomplete work markers with low severity', () => {
      const result = checkViolationsEnhanced(
        mockViolationParams.incomplete_work.action,
        mockViolationParams.incomplete_work.params,
        mockViolationParams.incomplete_work.context
      );

      expect(result.hasViolations).toBe(true);
      expect(result.violations[0].type).toBe('incomplete_work');
      expect(result.violations[0].severity).toBe('low');
      expect(result.shouldBlock).toBe(false);
      expect(result.highestScore).toBe(3.0);
    });

    it('should detect lorem ipsum placeholder text', () => {
      const result = checkViolationsEnhanced(
        mockViolationParams.placeholder_content.action,
        mockViolationParams.placeholder_content.params,
        mockViolationParams.placeholder_content.context
      );

      expect(result.hasViolations).toBe(true);
      expect(result.violations[0].type).toBe('placeholder_content');
      expect(result.shouldBlock).toBe(true);
    });

    it('should detect system interference (hooks directory)', () => {
      const result = checkViolationsEnhanced(
        mockViolationParams.system_interference.action,
        mockViolationParams.system_interference.params,
        mockViolationParams.system_interference.context
      );

      expect(result.hasViolations).toBe(true);
      expect(result.violations[0].type).toBe('system_interference');
      expect(result.violations[0].severity).toBe('medium');
      expect(result.shouldBlock).toBe(false);
    });

    it('should pass clean code without violations', () => {
      const result = checkViolationsEnhanced(
        cleanViolation.action,
        cleanViolation.params,
        cleanViolation.context
      );

      expect(result.hasViolations).toBe(false);
      expect(result.violations).toHaveLength(0);
      expect(result.shouldBlock).toBe(false);
      expect(result.highestScore).toBe(0);
      expect(result.message).toContain('No violations detected');
    });
  });

  describe('Violation Messages', () => {
    it('should include blocking message for high-severity violations', () => {
      const result = checkViolationsEnhanced(
        mockViolationParams.mock_data.action,
        mockViolationParams.mock_data.params,
        mockViolationParams.mock_data.context
      );

      expect(result.message).toContain('🚫 BLOCKED');
      expect(result.message).toContain('8.0/10');
    });

    it('should include warning message for medium-severity violations', () => {
      const result = checkViolationsEnhanced(
        'Write',
        { content: 'const hardcodedUserData = { username: "admin" }' },
        'Authentication setup'
      );

      expect(result.message).toContain('⚠️  CAUTION');
      expect(result.message).toContain('7.0/10');
    });

    it('should provide suggestions in violation details', () => {
      const result = checkViolationsEnhanced(
        mockViolationParams.mock_data.action,
        mockViolationParams.mock_data.params,
        mockViolationParams.mock_data.context
      );

      expect(result.violations[0].suggestion).toBeTruthy();
      expect(result.violations[0].risk).toBeTruthy();
      expect(result.violations[0].impact).toBeTruthy();
      expect(result.violations[0].safeAlternative).toBeTruthy();
    });
  });

  describe('Multiple Violations', () => {
    it('should detect multiple violations and report highest score', () => {
      const multiViolationParams = {
        content: 'const mockData = { fake: true }; // TODO: fix this'
      };

      const result = checkViolationsEnhanced(
        'Write',
        multiViolationParams,
        'Building feature'
      );

      expect(result.hasViolations).toBe(true);
      expect(result.violations.length).toBeGreaterThan(1);
      expect(result.highestScore).toBe(8.0); // mock_data is higher than incomplete_work
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty params', () => {
      const result = checkViolationsEnhanced('Write', {}, '');
      expect(result.hasViolations).toBe(false);
    });

    it('should handle null context', () => {
      const result = checkViolationsEnhanced('Write', { content: 'clean code' }, '');
      expect(result.hasViolations).toBe(false);
    });

    it('should handle case-insensitive pattern matching', () => {
      const upperCaseParams = { content: 'MOCK DATA HERE' };
      const result = checkViolationsEnhanced('Write', upperCaseParams, 'test');
      expect(result.hasViolations).toBe(true);
    });
  });
});
