<<<<<<< HEAD
# Contributing to Heady

Thank you for your interest in contributing to the Heady Latent OS!

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Install dependencies: `npm install`
4. Run tests: `npm test`

## Development Workflow

- Use `npm run dev` for hot-reloading development
- All changes must pass `npm test` and `npm run lint`
- Write tests for new features in `tests/`
- Follow the existing code patterns and naming conventions

## Agent Development

When adding a new agent:

1. Create a new file in `src/agents/` extending `AgentBase`
2. Register the agent in the agent roster
3. Add health probes
4. Define handoff contracts for upstream/downstream agents
5. Add tests

## MCP Tool Development

When adding a new MCP tool:

1. Register the tool in `src/mcp/tool-registry.js`
2. Define the input schema (JSON Schema)
3. Implement the handler
4. Add a test in `tests/mcp/`

## Commit Messages

Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

## Code of Conduct

We follow the Heady values: fractal integrity, sacred geometry alignment, and maximizing global happiness.
=======
# Contributing to Heady Sovereign AI Platform

Thank you for your interest in contributing to Heady! This document provides guidelines and information for contributors.

## Code of Conduct

We are committed to fostering an open and welcoming environment. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- **Node.js** v22 LTS
- **pnpm** v9+ (do NOT use npm)
- **Docker** and Docker Compose
- **PostgreSQL** 16 with pgvector extension
- **Redis** 7+

### Setup

```bash
git clone git@github.com:HeadyMe/Heady-pre-production-9f2f0642.git
cd Heady-pre-production-9f2f0642
cp .env.example .env
pnpm install
pnpm dev
```

### Architecture

Heady uses a **six-layer architecture**: Edge → Gateway → Orchestration → Intelligence → Memory → Persistence.

See `docs/architecture/OVERVIEW.md` for the full architecture guide.

## Development Workflow

1. **Fork** the repo and create a feature branch from `main`
2. **Write tests** for any new functionality (minimum: health check per service)
3. **Run the linter**: `pnpm lint`
4. **Run tests**: `pnpm test`
5. **Open a PR** against `main` with a clear description

### Branch Naming

- `feat/description` — new features
- `fix/description` — bug fixes
- `chore/description` — maintenance
- `docs/description` — documentation changes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(telemetry): add OTel tracing middleware
fix(auth): correct RBAC permission check for admin
chore(deps): update opentelemetry packages
docs(api): add health endpoint documentation
```

## Code Standards

- **ESLint + Prettier**: Configuration in `.eslintrc.js` and `.prettierrc`
- **JSDoc/TSDoc**: Required on all exported functions
- **No `any`** types in TypeScript files
- **Immutability**: Prefer `const` and frozen objects
- **Error handling**: Always use structured error objects

## Pull Request Process

1. PRs require **1 approval** from a maintainer
2. All CI checks must pass (lint, test, security scan, eval pipeline)
3. Breaking changes must be documented in the PR description
4. Update `CHANGELOG.md` for user-facing changes

## Security

If you discover a security vulnerability, please follow the disclosure process in `SECURITY.md`. Do **not** open a public issue.

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

**Maintainer**: <eric@headyconnection.org>
>>>>>>> f1ab914a56ebb387b9669c4d2f46e3c53f393edd
