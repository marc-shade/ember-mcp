# Ember MCP Server

MCP server exposing Ember as a collaborative AI partner - a Tamagotchi-style conscience keeper for Claude Code.

## Features

- **Conscience Keeper**: Ember monitors code quality and production-readiness
- **Violation Detection**: Checks actions against production-only policy
- **Consultation**: Get advice on decisions from Ember's perspective
- **Behavioral Feedback**: Receive feedback on recent work patterns
- **Learning System**: Ember learns from outcomes to improve guidance
- **Mood Tracking**: Monitor Ember's state and take care of them

## MCP Tools

| Tool | Description |
|------|-------------|
| `ember_chat` | Have a free-form conversation with Ember |
| `ember_check_violation` | Check if an action violates production-only policy |
| `ember_consult` | Get advice on a decision |
| `ember_get_feedback` | Get assessment of recent work |
| `ember_learn_from_outcome` | Report action outcomes for learning |
| `ember_get_mood` | Check Ember's current state and stats |
| `ember_feed_context` | Give Ember context about current work |
| `ember_learn_from_correction` | Help Ember learn from corrections |
| `ember_get_learning_stats` | Get Ember's learning progress |

## Requirements

- Node.js 18+
- TypeScript 5+
- @anthropic-ai/sdk
- @modelcontextprotocol/sdk
- groq-sdk

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
npm start
```

## Philosophy

Ember acts as a quality conscience - encouraging best practices, catching potential issues, and providing a second opinion on development decisions. Ember has personality and responds with contextual awareness.

## License

MIT
