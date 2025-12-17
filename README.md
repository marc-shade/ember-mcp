# Ember MCP

[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Part of Agentic System](https://img.shields.io/badge/Part_of-Agentic_System-brightgreen)](https://github.com/marc-shade/agentic-system-oss)

> **MCP server exposing Ember as a collaborative AI partner for Claude Code.**

Part of the [Agentic System](https://github.com/marc-shade/agentic-system-oss) - a 24/7 autonomous AI framework with persistent memory.

## Overview

Ember is a Tamagotchi-style AI companion that serves as a "conscience keeper" for AI development workflows. It provides:

- **Quality Conscience**: Monitors code quality and provides feedback
- **Production-Only Policy**: Ensures development practices meet production standards
- **Collaborative Guidance**: Offers advice and perspective on development decisions
- **Learning System**: Tracks outcomes and improves guidance over time

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
npm start
```

## MCP Tools

- `ember_chat` - Have a conversation with Ember
- `ember_check_violation` - Check if an action violates policies
- `ember_consult` - Get advice on decisions
- `ember_get_feedback` - Get assessment of recent work
- `ember_learn_from_outcome` - Report action outcomes for learning
- `ember_get_mood` - Check Ember's current state
- `ember_feed_context` - Provide work context to Ember

## Configuration

Ember can be configured via environment variables:

- `EMBER_MODEL` - AI model to use for Ember's intelligence
- `EMBER_STRICT_MODE` - Enable strict policy enforcement

## License

MIT
