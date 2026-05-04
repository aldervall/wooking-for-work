# Project Coding Standards

## General

- Use TypeScript strict mode where possible
- Prefer explicit types over inference
- All API inputs must be validated with Zod schemas
- Never commit API keys or secrets

## Git

- Write conventional commit messages
- Keep PRs focused on a single feature/fix
- Include tests for new functionality

## Security

- Validate all user inputs
- Sanitize HTML content (dompurify)
- Use auth middleware on all API routes
- Never log sensitive data (keys, passwords)
