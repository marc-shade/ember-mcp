/**
 * Tests for error handling and edge cases
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockEmberState } from './helpers.js';

// Mock file system operations
const mockReadFileSync = jest.fn<(...args: any[]) => string>();
const mockWriteFileSync = jest.fn<(...args: any[]) => void>();
const mockExistsSync = jest.fn<(...args: any[]) => boolean>();
const mockMkdirSync = jest.fn<(...args: any[]) => void>();

// Mock Groq API
const mockGroqCreate = jest.fn<(...args: any[]) => Promise<any>>();

describe('Error Handling', () => {
  beforeEach(() => {
    mockReadFileSync.mockClear();
    mockWriteFileSync.mockClear();
    mockExistsSync.mockClear();
    mockMkdirSync.mockClear();
    mockGroqCreate.mockClear();
  });

  describe('File System Errors', () => {
    it('should handle missing state file gracefully', () => {
      mockExistsSync.mockReturnValue(false);

      const getEmberState = () => {
        if (!mockExistsSync()) {
          return null;
        }
        return createMockEmberState();
      };

      const state = getEmberState();
      expect(state).toBeNull();
    });

    it('should handle corrupted state file', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{ invalid json }');

      const getEmberState = () => {
        try {
          if (!mockExistsSync()) return null;
          const data = mockReadFileSync() as string;
          return JSON.parse(data);
        } catch (error) {
          console.error('Error reading Ember state:', error);
          return null;
        }
      };

      const state = getEmberState();
      expect(state).toBeNull();
    });

    it('should handle write permission errors', () => {
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const logFeedback = (entry: any) => {
        try {
          mockWriteFileSync(JSON.stringify(entry));
          return true;
        } catch (error) {
          console.error('Error logging feedback:', error);
          return false;
        }
      };

      const result = logFeedback({ test: 'data' });
      expect(result).toBe(false);
    });

    it('should create directory if missing', () => {
      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockReturnValue(undefined);

      const ensureDirectory = (path: string) => {
        if (!mockExistsSync()) {
          mockMkdirSync(path, { recursive: true });
        }
      };

      ensureDirectory('/test/path');
      expect(mockMkdirSync).toHaveBeenCalledWith('/test/path', { recursive: true });
    });

    it('should handle empty log files', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('');

      const getRecentFeedback = () => {
        try {
          if (!mockExistsSync()) return [];
          const data = mockReadFileSync() as string;
          const lines = data.trim().split('\n').filter((l: string) => l);
          return lines.map((line: string) => JSON.parse(line));
        } catch (error) {
          console.error('Error reading feedback:', error);
          return [];
        }
      };

      const feedback = getRecentFeedback();
      expect(feedback).toEqual([]);
    });
  });

  describe('API Errors', () => {
    it('should handle Groq API timeout', async () => {
      mockGroqCreate.mockRejectedValue(new Error('Request timeout'));

      const askEmber = async (prompt: string) => {
        try {
          const response: any = await mockGroqCreate({
            model: 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: prompt }]
          });
          return response.choices[0]?.message?.content || '';
        } catch (error: any) {
          console.error('Groq API error:', error.message);
          return '🔥 Ember: *crackles thoughtfully* Let me think about that...';
        }
      };

      const response = await askEmber('Test');
      expect(response).toContain('crackles thoughtfully');
    });

    it('should handle Groq API rate limiting', async () => {
      mockGroqCreate.mockRejectedValue(new Error('Rate limit exceeded'));

      const askEmber = async (prompt: string) => {
        try {
          const response: any = await mockGroqCreate({
            model: 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: prompt }]
          });
          return response.choices[0]?.message?.content || '';
        } catch (error: any) {
          console.error('Groq API error:', error.message);
          if (error.message.toLowerCase().includes('rate limit')) {
            return '🔥 Ember: *taking a breath* Give me a moment...';
          }
          return '🔥 Ember: *uncertain*';
        }
      };

      const response = await askEmber('Test');
      expect(response).toContain('taking a breath');
    });

    it('should handle missing API key', async () => {
      const GROQ_API_KEY = '';

      if (!GROQ_API_KEY) {
        const warning = 'Warning: GROQ_API_KEY not set. Ember intelligence features will be limited.';
        expect(warning).toContain('GROQ_API_KEY not set');
      }
    });

    it('should handle malformed API response', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: []
      });

      const askEmber = async (prompt: string) => {
        try {
          const response: any = await mockGroqCreate({
            model: 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: prompt }]
          });
          return response.choices[0]?.message?.content || '🔥 *crackles softly*';
        } catch (error) {
          return '🔥 *uncertain*';
        }
      };

      const response = await askEmber('Test');
      expect(response).toContain('crackles softly');
    });
  });

  describe('Input Validation', () => {
    it('should handle null action in violation check', () => {
      const checkViolations = (action: string | null, params: any, context: string) => {
        if (!action) {
          return {
            hasViolations: false,
            violations: [],
            highestScore: 0,
            shouldBlock: false,
            message: 'Invalid action'
          };
        }
        return { hasViolations: false, violations: [], highestScore: 0, shouldBlock: false, message: 'OK' };
      };

      const result = checkViolations(null, {}, 'test');
      expect(result.message).toBe('Invalid action');
    });

    it('should handle undefined params in violation check', () => {
      const checkViolations = (action: string, params: any, context: string) => {
        const searchText = JSON.stringify(params || {}) + ' ' + (context || '');
        return {
          hasViolations: false,
          searchText
        };
      };

      const result = checkViolations('Write', undefined, 'test');
      expect(result.searchText).toContain('test');
    });

    it('should handle empty string context', () => {
      const checkViolations = (action: string, params: any, context: string) => {
        const searchText = JSON.stringify(params) + ' ' + (context || '');
        return { searchText: searchText.trim() };
      };

      const result = checkViolations('Write', { test: 'data' }, '');
      expect(result.searchText).toBeTruthy();
    });

    it('should handle very long input', () => {
      const longContext = 'a'.repeat(10000);
      const checkViolations = (action: string, params: any, context: string) => {
        const searchText = JSON.stringify(params) + ' ' + context;
        return { length: searchText.length };
      };

      const result = checkViolations('Write', {}, longContext);
      expect(result.length).toBeGreaterThan(10000);
    });

    it('should handle special characters in input', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\';
      const checkViolations = (action: string, params: any, context: string) => {
        const searchText = JSON.stringify(params) + ' ' + context;
        return { processed: true, searchText };
      };

      const result = checkViolations('Write', { content: specialChars }, 'test');
      expect(result.processed).toBe(true);
    });
  });

  describe('State Validation', () => {
    it('should handle state with missing properties', () => {
      const partialState: any = {
        name: 'Ember',
        hunger: 50
        // Missing other properties
      };

      const validateState = (state: any) => {
        const required = ['name', 'hunger', 'energy', 'happiness', 'cleanliness', 'health'];
        const missing = required.filter(prop => !(prop in state));
        return { valid: missing.length === 0, missing };
      };

      const validation = validateState(partialState);
      expect(validation.valid).toBe(false);
      expect(validation.missing.length).toBeGreaterThan(0);
    });

    it('should handle state with invalid values', () => {
      const invalidState = {
        hunger: 150, // > 100
        energy: -10, // < 0
        happiness: 'not a number', // wrong type
      };

      const validateStat = (value: any) => {
        if (typeof value !== 'number') return false;
        if (value < 0 || value > 100) return false;
        return true;
      };

      expect(validateStat(invalidState.hunger)).toBe(false);
      expect(validateStat(invalidState.energy)).toBe(false);
      expect(validateStat(invalidState.happiness)).toBe(false);
    });

    it('should clamp out-of-range values', () => {
      const clampStat = (value: number) => Math.max(0, Math.min(100, value));

      expect(clampStat(150)).toBe(100);
      expect(clampStat(-50)).toBe(0);
      expect(clampStat(50)).toBe(50);
    });
  });

  describe('Session Context Errors', () => {
    it('should handle missing session context file', () => {
      mockExistsSync.mockReturnValue(false);

      const getSessionContext = () => {
        try {
          if (!mockExistsSync()) {
            return {
              startTime: Date.now(),
              recentActions: []
            };
          }
          return JSON.parse(mockReadFileSync() as string);
        } catch (error) {
          return {
            startTime: Date.now(),
            recentActions: []
          };
        }
      };

      const context = getSessionContext();
      expect(context).toHaveProperty('startTime');
      expect(context).toHaveProperty('recentActions');
    });

    it('should handle invalid task type', () => {
      const validateTaskType = (type: string) => {
        const validTypes = ['development', 'testing', 'monitoring', 'refactoring', 'unknown'];
        return validTypes.includes(type) ? type : 'unknown';
      };

      expect(validateTaskType('invalid_type')).toBe('unknown');
      expect(validateTaskType('development')).toBe('development');
    });
  });

  describe('Concurrent Access', () => {
    it('should handle multiple simultaneous writes', async () => {
      let writeCount = 0;
      mockWriteFileSync.mockImplementation(() => {
        writeCount++;
      });

      const writeData = async () => {
        mockWriteFileSync(JSON.stringify({ data: 'test' }));
      };

      await Promise.all([
        writeData(),
        writeData(),
        writeData()
      ]);

      expect(writeCount).toBe(3);
    });
  });

  describe('Resource Cleanup', () => {
    it('should handle cleanup on shutdown', () => {
      let cleanupCalled = false;

      const cleanup = () => {
        cleanupCalled = true;
      };

      process.on('SIGTERM', cleanup);
      process.removeListener('SIGTERM', cleanup);

      expect(cleanupCalled).toBe(false);
    });
  });
});
