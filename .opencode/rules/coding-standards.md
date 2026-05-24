# Coding Standards

## General
- Prefer MCP tools over shell scripts for API calls
- All resume JSON must validate against https://rxresu.me/schema.json
- Never commit `.env` files or inline API keys
- Use `{env:VAR}` syntax in `opencode.json` for secrets

## File Conventions
- JSON files: 2-space indentation
- Markdown files: wrap at 80 chars where practical
- Shell scripts: `set -e` at top, source `.env` for secrets

## Git
- Write conventional commit messages
- Never commit API keys, passwords, or tokens
- Keep `.env` in `.gitignore`
