# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitPulse is a technical content automation pipeline that analyzes Git code changes, then auto-generates changelogs, technical blogs, and documentation. It uses AST parsing to understand code semantics beyond simple diffs.

## Package Manager

This project uses **pnpm** (v8.15.1) as the package manager. Always use `pnpm` instead of `npm` or `yarn`.

## Common Commands

### Development

```bash
# Install dependencies
pnpm install

# Start all packages in development mode (parallel)
pnpm dev

# Start specific package
pnpm dev:web    # Web frontend (Vite React app)
pnpm dev:api    # API server (Express)
pnpm dev:cli    # CLI (builds with tsup --watch)
```

### Build

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @gitpulse/api build
pnpm --filter @gitpulse/core build
pnpm --filter @gitpulse/cli build
```

### Testing

```bash
# Run all unit tests across packages
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E browser tests (Playwright)
cd tests && node run-all.js
```

### Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Fix lint errors
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type check all packages
pnpm typecheck
```

### Database (Prisma)

Prisma schema is located in `packages/core/prisma/schema.prisma`.

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

### CLI Usage

After building the CLI:

```bash
# Run CLI
pnpm cli --help
# Or directly
node packages/cli/dist/index.js --help
```

## Architecture

### Monorepo Structure

The project uses pnpm workspaces with 5 packages in `packages/`:

```
packages/
├── core/           # Core engine - shared library
├── api/            # Express REST API server
├── web/            # React + Vite frontend
├── cli/            # Command-line interface
└── github-action/  # GitHub Actions integration
```

### Package Dependencies

- `@gitpulse/core` is the base package - all other packages depend on it
- `@gitpulse/api` and `@gitpulse/web` form the full-stack web application
- `@gitpulse/cli` can work standalone with just the core package
- `@gitpulse/github-action` wraps the core functionality for CI/CD

### Core Package Modules (`packages/core/src/`)

The core package exports multiple submodules:

| Module | Purpose |
|--------|---------|
| `diff-analyzer/` | AST-based code diff parsing (JS/TS/Python) |
| `content-engine/` | AI content generation (changelog, technical blog, SEO) |
| `context-reader/` | Project context analysis (package.json, README, structure) |
| `doc-sync/` | VitePress documentation sync |
| `seo/` | SEO scoring and keyword optimization |
| `ai/` | AI provider abstractions (OpenAI, Anthropic, Ollama) |
| `types/` | Shared TypeScript types |

The core package uses **multiple entry points** (defined in `tsup.config.ts`), allowing imports like:
```typescript
import { something } from '@gitpulse/core/diff-analyzer';
```

### API Architecture (`packages/api/src/`)

Express server with route structure:

```
index.ts          # Server entry, middleware setup
config/           # Environment configuration
middleware/       # auth.ts, error.ts, logger.ts
routes/           # Route handlers (auth, projects, contents, commits, users, health)
```

All API responses follow a standardized format:
```typescript
{
  code: number,      // 0 = success, non-zero = error
  message: string,
  data: any,
  timestamp: string
}
```

### Web Architecture (`packages/web/src/`)

React 18 + Vite + Tailwind CSS:

```
main.tsx          # Entry point
App.tsx           # Root component with routing
pages/            # Page components (Dashboard, Projects, Content, etc.)
components/       # Reusable components (Layout/)
stores/           # Zustand state management (useAuthStore, useUIStore)
lib/              # Utilities (api.ts for HTTP client, utils.ts)
```

### CLI Architecture (`packages/cli/src/`)

Commander-based CLI with commands in `commands/`:

- `init.ts` - Initialize GitPulse in a project
- `analyze.ts` - Analyze git commits/diffs
- `generate.ts` - Generate content (changelog, blog)
- `sync.ts` - Sync documentation
- `run.ts` - Run the full pipeline
- `status.ts` - Show project status
- `config.ts` - Configuration management
- `server.ts` - Start local API server

### Database Schema

PostgreSQL with Prisma ORM. Key models:

- `users` - User accounts with OAuth support
- `projects` - Git repositories being tracked
- `project_members` - Many-to-many user-project relationships
- `commits` - Analyzed git commits with impact levels
- `contents` - Generated content (changelog, technical, SEO types)
- `content_versions` - Version history for content
- `approvals` - Content approval workflow
- `contexts` - Project context cache (package.json, README, etc.)

## Technology Stack

- **Runtime**: Node.js 20+, ESM modules only (`"type": "module"`)
- **Language**: TypeScript 5.3+ with strict settings
- **Build**: tsup (for packages), Vite (for web)
- **Database**: PostgreSQL 15, Prisma 5, Redis 7 (cache)
- **Frontend**: React 18, Tailwind CSS, Radix UI, Zustand, TanStack Query
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint with TypeScript, Prettier

## Development Environment

### Docker Services

```bash
# Start PostgreSQL and Redis
docker-compose -f docker/docker-compose.yml up -d
```

Services:
- PostgreSQL on port 5432
- Redis on port 6379

### Environment Variables

The API and CLI require certain environment variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gitpulse
OPENAI_API_KEY=           # For OpenAI integration
ANTHROPIC_API_KEY=        # For Anthropic/Claude integration
JWT_SECRET=               # For API authentication
```

## Code Style & Conventions

### ESLint Rules

- Explicit return types not required
- No floating promises (must be handled)
- Import ordering enforced (builtin → external → internal)
- Unused variables must start with `_`
- Console logs limited to warn/error

### TypeScript Configuration

- Strict mode enabled with comprehensive checks
- ESM module resolution ("bundler")
- Declaration maps for go-to-definition
- Composite projects for monorepo references

### Naming Conventions

- Database: snake_case (following Prisma schema)
- TypeScript: camelCase for variables/functions, PascalCase for types/classes
- Files: kebab-case for multi-word files

## Testing Patterns

### Unit Tests (Vitest)

Located alongside source files as `*.test.ts`:

```typescript
// Example: packages/core/src/content-engine/generators/index.test.ts
import { describe, it, expect } from 'vitest';

describe('feature', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### E2E Tests (Playwright)

Located in `tests/` directory:

```bash
cd tests
node run-all.js    # Runs all *.spec.js files
```

## Gotchas & Common Issues

### Database Schema Changes

- `commits.hash` 已从全局唯一 (`@unique`) 改为组合唯一 (`@@unique([hash, project_id])`)
  - 允许同一 commit hash 在不同项目中独立存在
  - 查询时使用 `findFirst({ hash, project_id })` 而非 `findUnique({ hash })`

### React Query Data Fetching

Dashboard 和 Projects 页面使用 `staleTime: 0` 确保每次进入都刷新数据：

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['projects'],
  queryFn: () => projectsAPI.getProjects(),
  staleTime: 0,              // 禁用缓存，每次进入都获取
  refetchOnWindowFocus: true, // 切回页面时自动刷新
});
```

### API Permission Patterns

- `checkProjectPermission()` - 检查 owner/admin 权限（用于修改操作）
- `checkProjectMember()` - 检查成员权限（用于读取操作）
- 同步 commits 允许所有成员（viewer 也可以触发）

## Important File Locations

| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Workspace package definitions |
| `packages/core/prisma/schema.prisma` | Database schema |
| `packages/core/tsup.config.ts` | Core package build config (multiple entry points) |
| `packages/web/vite.config.ts` | Web app build configuration |
| `.eslintrc.json` | ESLint configuration |
| `tsconfig.json` | Root TypeScript configuration |
