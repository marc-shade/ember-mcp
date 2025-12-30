/**
 * Jest setup file for Ember MCP tests
 */

import { jest } from '@jest/globals';

// Set test environment variables
process.env.GROQ_API_KEY = 'test-api-key-12345';
process.env.EMBER_GROQ_MODEL = 'openai/gpt-oss-120b';

// Mock console.error to reduce noise during tests
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Set timeout for async operations
jest.setTimeout(10000);
