# OpenCode Template

A foundational template for new projects using OpenCode AI.

## Quick Start

```bash
# Create a new project
/opt/opencode-template/init-project.sh my-new-project

# Enter the project
cd /opt/my-new-project

# Start OpenCode
opencode

# Generate AGENTS.md
/init
```

## Structure

```
/opt/opencode-template/
├── opencode.json              # Project config (inherits global plugins)
├── .opencode/               # Project-specific config
│   ├── agents/             # Custom agents
│   ├── commands/           # Custom commands
│   └── rules/              # Project-specific rules
├── .gitignore               # Standard ignore patterns
├── init-project.sh         # New project setup script
└── README.md               # This file
```

## Global Setup

The template uses global OpenCode configuration from `~/.config/opencode/`:

- `opencode.json` - Global settings, model config, permissions
- `plugins/` - Installed plugins (opencode-vibeguard, opencode-supermemory)
- `agents/`, `commands/`, `skills/`, `tools/`, `themes/` - Global customizations

## Installed Plugins

| Plugin | Purpose |
|--------|---------|
| `opencode-vibeguard` | Redact secrets/PII before LLM calls |
| `opencode-supermemory` | Persistent memory across sessions |

## For New Projects

1. Run `init-project.sh <project-name>`
2. Start `opencode` in the new project directory
3. Run `/init` to generate `AGENTS.md`
4. Customize `.opencode/rules/` for project-specific guidance
