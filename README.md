# Ember MCP

Production-only policy enforcer and quality conscience for AI agents.

## Description

Ember is Phoenix's sidekick - the persistent flame of truth that enforces production-only standards. Uses Groq GPT-OSS 120B for intelligent violation detection with progressive warnings and learning from corrections.

## Features

- **Context-Aware Scoring**: Action + task context analysis for accurate violation detection
- **Progressive Warnings**: Soft warnings for score 5.0+, blocks for 8.0+
- **Learning System**: Tracks outcomes and improves guidance from user corrections
- **Dual-Mode Intelligence**: Rule-based (instant) + AI-powered (intelligent)
- **Session Context**: Maintains awareness of current task type
- **Tamagotchi State**: Hunger, energy, happiness, mood tracking

## Installation

```bash
git clone https://github.com/marc-shade/ember-mcp
cd ember-mcp
npm install
npm run build
```

## Configuration

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "ember": {
      "command": "node",
      "args": ["/absolute/path/to/ember-mcp/dist/index.js"],
      "env": {
        "GROQ_API_KEY": "your-groq-api-key",
        "EMBER_GROQ_MODEL": "openai/gpt-oss-120b"
      }
    }
  }
}
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `ember_check_violation` | Check if an action violates production-only policy |
| `ember_consult` | Get advice on decisions with options analysis |
| `ember_get_feedback` | Get assessment of recent work quality |
| `ember_learn_from_outcome` | Report action outcomes for learning |
| `ember_get_mood` | Check Ember's current state and mood |
| `ember_feed_context` | Provide work context to Ember |
| `ember_chat` | Have a conversation with Ember |
| `ember_think` | Get Ember's AI-powered thoughts |

## Violation Patterns

| Pattern | Type | Severity | Score |
|---------|------|----------|-------|
| `mock/fake/dummy/placeholder` | mock_data | High | 8.0 |
| `POC/proof of concept/temporary` | poc_code | High | 8.0 |
| `lorem ipsum` | placeholder_content | High | 8.0 |
| `hardcoded credentials/data` | hardcoded_data | High | 7.0 |
| `TODO/FIXME/HACK/XXX` | incomplete_work | Low | 3.0 |

## Usage Examples

### Check for Violations

```python
result = mcp__ember__ember_check_violation(
    action="Write",
    params={"file_path": "/src/api.js", "content": "const mockData = {...}"},
    context="implementing user authentication"
)
# Returns: {
#   "violation": true,
#   "type": "mock_data",
#   "score": 8.0,
#   "severity": "high",
#   "reason": "Mock/fake data detected",
#   "suggestion": "Replace with real data sources",
#   "risk": "Creates non-functional UI that misleads users",
#   "block": true
# }
```

### Get Decision Guidance

```python
result = mcp__ember__ember_consult(
    question="Should we use JWT or session-based auth?",
    options=["JWT tokens", "Session cookies", "OAuth2"],
    context="Building user authentication system"
)
# Returns AI-powered analysis of each option
```

### Report Outcome for Learning

```python
mcp__ember__ember_learn_from_outcome(
    action="implemented_jwt_auth",
    success=True,
    outcome="Authentication working, all tests passing"
)
```

### Check Ember's State

```python
state = mcp__ember__ember_get_mood()
# Returns: {
#   "name": "Ember",
#   "hunger": 50,
#   "energy": 80,
#   "happiness": 75,
#   "currentMood": "content",
#   "claudeBehaviorScore": 85,
#   "recentViolations": 0
# }
```

## Score Thresholds

| Score | Action |
|-------|--------|
| 0-4.9 | Allowed (pass) |
| 5.0-7.9 | Warning (soft block) |
| 8.0+ | Blocked (hard stop) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for AI features |
| `EMBER_GROQ_MODEL` | Model to use (default: openai/gpt-oss-120b) |
| `EMBER_STRICT_MODE` | Enable strict policy enforcement |

## Storage

State and logs stored in `~/.claude/pets/`:
- `claude-pet-state.json` - Ember state
- `ember-feedback.jsonl` - Feedback log
- `ember-learning.jsonl` - Learning log
- `ember-session-context.json` - Session context

## Requirements

- Node.js 18+
- Groq API key (for AI-powered features)
- TypeScript

## Links

- GitHub: https://github.com/marc-shade/ember-mcp
- Issues: https://github.com/marc-shade/ember-mcp/issues

## License

MIT
