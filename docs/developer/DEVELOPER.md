# 👩‍💻 NetPulse UpGuardX — Developer Documentation

> For contributors and developers building on or extending NetPulse UpGuardX.

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Project Structure](#2-project-structure)
3. [Running Locally](#3-running-locally)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Database Setup & Migrations](#5-database-setup--migrations)
6. [Coding Standards](#6-coding-standards)
7. [Adding a New Monitor Type](#7-adding-a-new-monitor-type)
8. [Adding a New Alert Channel](#8-adding-a-new-alert-channel)
9. [API Development Guide](#9-api-development-guide)
10. [Frontend Development Guide](#10-frontend-development-guide)
11. [Worker / Probe Development](#11-worker--probe-development)
12. [Agent Development](#12-agent-development)
13. [Testing](#13-testing)
14. [Docker Development Workflow](#14-docker-development-workflow)
15. [Git Workflow & Conventions](#15-git-workflow--conventions)
16. [Debugging Tips](#16-debugging-tips)

---

## 1. Development Environment Setup

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | API + Web frontend |
| Go | 1.22+ | Worker + Agent |
| Docker | 24+ | Local services (DB, Redis) |
| Docker Compose | v2 | Orchestrate local services |
| pnpm | 8+ | Monorepo package manager |
| PostgreSQL Client | 15+ | Optional (psql CLI) |

### Install Prerequisites (Ubuntu / Debian)

```bash
# Node.js 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20

# pnpm
npm install -g pnpm

# Go 1.22
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.profile

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Clone & Install

```bash
git clone https://github.com/your-org/netpulse-upguardx.git
cd netpulse-upguardx

# Install all JS/TS dependencies (workspaces)
pnpm install

# Install Go dependencies (worker + agent)
cd apps/worker && go mod download && cd ../..
cd apps/agent && go mod download && cd ../..
```

---

## 2. Project Structure

```
netpulse-upguardx/
│
├── apps/
│   ├── web/                      # Next.js 14 frontend
│   │   ├── app/                  # App Router pages
│   │   ├── components/           # React components
│   │   ├── lib/                  # Utilities, API client
│   │   ├── hooks/                # Custom React hooks
│   │   └── public/
│   │
│   ├── api/                      # Node.js API (TypeScript)
│   │   ├── src/
│   │   │   ├── routes/           # Route handlers (one file per resource)
│   │   │   ├── middleware/       # Auth, RBAC, rate-limit, etc.
│   │   │   ├── services/         # Business logic
│   │   │   ├── db/               # Prisma client + helpers
│   │   │   ├── queue/            # BullMQ producers
│   │   │   └── utils/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── tests/
│   │
│   ├── worker/                   # Go monitor worker
│   │   ├── cmd/worker/main.go
│   │   ├── internal/
│   │   │   ├── scheduler/        # Redis-based scheduler
│   │   │   ├── probes/           # HTTP, TCP, ICMP, DNS, SSL probes
│   │   │   ├── evaluator/        # Result evaluation & incident logic
│   │   │   └── alerter/          # Alert dispatch
│   │   └── go.mod
│   │
│   └── agent/                    # Go host agent
│       ├── cmd/agent/main.go
│       ├── internal/
│       │   ├── collector/        # CPU, RAM, Disk, Docker collectors
│       │   ├── logwatcher/       # Log file tailing
│       │   └── reporter/         # API reporter
│       └── go.mod
│
├── packages/
│   ├── ui/                       # Shared React components (TailwindCSS)
│   ├── types/                    # Shared TypeScript types / Zod schemas
│   └── config/                   # Shared ESLint, tsconfig, etc.
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── Dockerfiles/
│   ├── kubernetes/
│   │   ├── base/
│   │   └── overlays/
│   └── caddy/
│       └── Caddyfile
│
├── docs/                         # All documentation
├── scripts/                      # Dev helper scripts
├── .env.example
├── pnpm-workspace.yaml
└── turbo.json                    # Turborepo build config
```

---

## 3. Running Locally

### Step 1: Start infrastructure services

```bash
# Starts PostgreSQL + Redis in Docker
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

### Step 2: Configure environment

```bash
cp .env.example .env
# Edit .env with your local values (DB URL, secrets, etc.)
```

### Step 3: Run database migrations

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed     # Optional: seed demo data
```

### Step 4: Start all services (development mode)

```bash
# From repo root — starts web + api in parallel via Turborepo
pnpm dev

# OR start individually:
cd apps/web && pnpm dev        # http://localhost:3000
cd apps/api && pnpm dev        # http://localhost:3001
cd apps/worker && go run ./cmd/worker   # worker process
cd apps/agent && go run ./cmd/agent     # agent (optional)
```

### Default Ports

| Service | Port |
|---|---|
| Web (Next.js) | 3000 |
| API (Fastify) | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## 4. Environment Variables Reference

### `apps/api/.env`

```bash
# Database
DATABASE_URL="postgresql://netpulse:password@localhost:5432/netpulse_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="another-secret-for-refresh-tokens"
ENCRYPTION_KEY="64-character-hex-string-for-aes256"   # openssl rand -hex 32

# App
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Email (SMTP)
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="postmaster@yourdomain.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="NetPulse Alerts <alerts@yourdomain.com>"

# Twilio (SMS)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_DEMO_MODE=false
```

### `apps/web/.env.local`

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_NAME="NetPulse UpGuardX"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### `apps/worker/.env` or environment

```bash
DATABASE_URL="postgresql://netpulse:password@localhost:5432/netpulse_dev"
REDIS_URL="redis://localhost:6379"
WORKER_CONCURRENCY=50
WORKER_REGION="us-east-1"
```

---

## 5. Database Setup & Migrations

### Prisma Commands

```bash
cd apps/api

# Create a new migration after editing schema.prisma
pnpm prisma migrate dev --name add_monitor_tags

# Apply pending migrations (production)
pnpm prisma migrate deploy

# Reset dev database (drops + re-creates)
pnpm prisma migrate reset

# Open Prisma Studio (visual DB editor)
pnpm prisma studio

# Regenerate Prisma client after schema changes
pnpm prisma generate
```

### Seeding Demo Data

```bash
pnpm prisma db seed
```

Seed script is at `apps/api/prisma/seed.ts`. It creates:
- 1 demo organization (`Acme Corp`)
- 1 admin user (`admin@example.com` / `password123`)
- 5 sample monitors
- Sample alert channels

> **Do not use demo credentials in production.**

---

## 6. Coding Standards

### TypeScript (API + Web)

- **Style:** ESLint + Prettier (configs in `packages/config`)
- **Imports:** Absolute paths via `tsconfig` path aliases (`@/components/...`)
- **Types:** Prefer Zod schemas for runtime validation; derive TypeScript types from them
- **No `any`:** Use `unknown` and narrow types explicitly
- **Error handling:** Always use typed error classes; never `throw "string"`

```typescript
// ✅ Good
import { z } from 'zod'

const CreateMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['http', 'https', 'tcp', 'icmp', 'dns', 'ssl']),
  target: z.string().url(),
  intervalSeconds: z.number().int().min(10).default(60),
})

type CreateMonitorInput = z.infer<typeof CreateMonitorSchema>

// ❌ Bad
function createMonitor(data: any) { ... }
```

### Go (Worker + Agent)

- **Style:** `gofmt` + `golangci-lint`
- **Errors:** Wrap with `fmt.Errorf("context: %w", err)` for traceability
- **Interfaces:** Define at point of use (consumer side)
- **Context:** Always propagate `context.Context` through call chain

```go
// ✅ Good
func (p *HTTPProbe) Execute(ctx context.Context, monitor Monitor) (CheckResult, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", monitor.Target, nil)
    if err != nil {
        return CheckResult{}, fmt.Errorf("http probe: create request: %w", err)
    }
    // ...
}
```

### Commit Messages (Conventional Commits)

```
feat: add Discord alert channel
fix: resolve SSL expiry calculation off-by-one
docs: update API endpoint reference
chore: upgrade Prisma to 5.10
test: add unit tests for HTTP probe
refactor: extract alert dispatcher into service layer
```

---

## 7. Adding a New Monitor Type

### Step 1: Define the probe (Go — `apps/worker`)

```go
// apps/worker/internal/probes/myprobe.go
package probes

import (
    "context"
    "time"
)

type MyProbe struct{}

func (p *MyProbe) Execute(ctx context.Context, m Monitor) (CheckResult, error) {
    start := time.Now()
    // ... your probe logic ...
    return CheckResult{
        Status:         StatusUp,
        ResponseTimeMs: int(time.Since(start).Milliseconds()),
    }, nil
}
```

### Step 2: Register the probe

```go
// apps/worker/internal/probes/registry.go
func NewRegistry() *Registry {
    return &Registry{
        probes: map[string]Probe{
            "http":  &HTTPProbe{},
            "https": &HTTPProbe{},
            "tcp":   &TCPProbe{},
            "icmp":  &ICMPProbe{},
            "dns":   &DNSProbe{},
            "ssl":   &SSLProbe{},
            "mytype": &MyProbe{},  // ← add here
        },
    }
}
```

### Step 3: Update Prisma schema

```prisma
// Add to the type enum in schema.prisma
model Monitor {
  type  String  // add 'mytype' to application-level validation
}
```

### Step 4: Add Zod validation (API)

```typescript
// apps/api/src/routes/monitors.ts
const monitorTypes = ['http','https','tcp','icmp','dns','ssl','mytype'] as const
```

### Step 5: Add UI (Frontend)

- Add form fields in `apps/web/components/monitors/MonitorForm.tsx`
- Add icon/label in `apps/web/lib/monitorTypes.ts`
- Add help text / tooltip in the UI component

---

## 8. Adding a New Alert Channel

### Step 1: Create the dispatcher (API)

```typescript
// apps/api/src/services/alerts/dispatchers/myChannel.ts
import { AlertChannel, AlertEvent } from '@/types'

export async function dispatchMyChannel(
  channel: AlertChannel,
  event: AlertEvent
): Promise<void> {
  const { webhookUrl } = channel.config as MyChannelConfig
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formatPayload(event)),
  })
}
```

### Step 2: Register in dispatcher factory

```typescript
// apps/api/src/services/alerts/dispatcher.ts
import { dispatchMyChannel } from './dispatchers/myChannel'

const dispatchers: Record<string, Dispatcher> = {
  email: dispatchEmail,
  slack: dispatchSlack,
  // ...
  mychannel: dispatchMyChannel,  // ← add here
}
```

### Step 3: Add config schema (Zod)

```typescript
// packages/types/src/alertChannels.ts
export const MyChannelConfigSchema = z.object({
  webhookUrl: z.string().url(),
  // other fields...
})
```

### Step 4: Add UI in settings

Add setup form in `apps/web/components/alerts/channels/MyChannelForm.tsx`

---

## 9. API Development Guide

### Route Structure

```typescript
// apps/api/src/routes/monitors.ts
import { FastifyPluginAsync } from 'fastify'
import { authenticate } from '@/middleware/auth'
import { requireRole } from '@/middleware/rbac'
import { MonitorService } from '@/services/MonitorService'
import { CreateMonitorSchema } from '@netpulse/types'

const monitorRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', authenticate)

  fastify.get('/', async (req, reply) => {
    const monitors = await MonitorService.list(req.user.orgId)
    return { success: true, data: monitors }
  })

  fastify.post('/', {
    preHandler: requireRole('admin'),
    schema: { body: CreateMonitorSchema },
  }, async (req, reply) => {
    const monitor = await MonitorService.create(req.user.orgId, req.body)
    reply.status(201)
    return { success: true, data: monitor }
  })
}

export default monitorRoutes
```

### Middleware

```typescript
// Auth middleware: verifies JWT and attaches req.user
// RBAC middleware: checks role from req.user.role
// Rate limit middleware: Redis sliding window per IP
// Audit middleware: logs state-changing requests
```

### Error Handling

```typescript
// Use FastifyError or custom AppError
throw new AppError('MONITOR_NOT_FOUND', 'Monitor not found', 404)

// Global error handler in apps/api/src/app.ts formats all errors uniformly
```

---

## 10. Frontend Development Guide

### Component Structure

```
apps/web/components/
├── ui/           # Primitive components (Button, Input, Card, etc.)
├── layout/       # AppShell, Sidebar, Header
├── monitors/     # Monitor-specific components
├── alerts/       # Alert channel forms & list
├── status/       # Status page builder
└── reports/      # Report widgets & charts
```

### API Client

```typescript
// apps/web/lib/api.ts
import ky from 'ky'

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken()  // from cookie/localStorage
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      }
    ]
  }
})

// Usage
const monitors = await api.get('v1/monitors').json<Monitor[]>()
```

### Data Fetching Pattern

```typescript
// Use TanStack Query for all server state
import { useQuery, useMutation } from '@tanstack/react-query'

export function useMonitors() {
  return useQuery({
    queryKey: ['monitors'],
    queryFn: () => api.get('v1/monitors').json(),
  })
}

export function useCreateMonitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('v1/monitors', { json: data }).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitors'] }),
  })
}
```

---

## 11. Worker / Probe Development

### Running the Worker

```bash
cd apps/worker

# Development (with auto-reload via air)
air

# Or directly
go run ./cmd/worker

# Environment
export REDIS_URL=redis://localhost:6379
export DATABASE_URL=postgresql://...
```

### Probe Interface

```go
type Probe interface {
    Execute(ctx context.Context, monitor Monitor) (CheckResult, error)
}

type CheckResult struct {
    Status         Status  // Up, Down, Degraded
    ResponseTimeMs int
    StatusCode     int     // for HTTP
    ErrorMessage   string
    Metadata       map[string]any
}
```

### Testing a Probe

```go
// apps/worker/internal/probes/http_test.go
func TestHTTPProbe_Up(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(200)
    }))
    defer server.Close()

    probe := &HTTPProbe{}
    result, err := probe.Execute(context.Background(), Monitor{Target: server.URL})
    
    assert.NoError(t, err)
    assert.Equal(t, StatusUp, result.Status)
    assert.Equal(t, 200, result.StatusCode)
}
```

---

## 12. Agent Development

### Running the Agent

```bash
cd apps/agent

# Development
go run ./cmd/agent

# Config file
cp config.example.yaml config.yaml
# Edit config.yaml with your API URL and key
```

### Adding a New Collector

```go
// apps/agent/internal/collector/my_collector.go
package collector

type MyMetric struct {
    Value float64 `json:"value"`
}

type MyCollector struct{}

func (c *MyCollector) Collect(ctx context.Context) (MyMetric, error) {
    // ... collect your metric
    return MyMetric{Value: 42.0}, nil
}
```

Register in `apps/agent/internal/reporter/reporter.go` and include in the payload struct.

---

## 13. Testing

### API Tests

```bash
cd apps/api

# Unit tests
pnpm test

# Integration tests (requires running DB + Redis)
pnpm test:integration

# Coverage report
pnpm test:coverage
```

### Testing conventions

- Unit test files: `*.test.ts` co-located with source
- Integration tests: `tests/integration/`
- Use `vitest` for unit tests
- Use `supertest` for HTTP integration tests
- Mock external services (SMTP, Twilio) in tests

```typescript
// Example integration test
describe('POST /v1/monitors', () => {
  it('creates a monitor for authenticated admin', async () => {
    const res = await request(app)
      .post('/v1/monitors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'My API', type: 'https', target: 'https://example.com' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.name).toBe('My API')
  })
})
```

### Worker Tests (Go)

```bash
cd apps/worker
go test ./...
go test ./... -v -run TestHTTPProbe
```

### End-to-End Tests

```bash
# Uses Playwright
cd apps/web
pnpm test:e2e
```

---

## 14. Docker Development Workflow

### Build individual images

```bash
# API
docker build -f infrastructure/docker/Dockerfiles/api.Dockerfile -t netpulse-api .

# Web
docker build -f infrastructure/docker/Dockerfiles/web.Dockerfile -t netpulse-web .

# Worker
docker build -f infrastructure/docker/Dockerfiles/worker.Dockerfile -t netpulse-worker .
```

### Full stack with Docker Compose

```bash
# Start everything
docker-compose up --build

# Stop
docker-compose down

# Reset volumes (clear database)
docker-compose down -v
```

### Live reload in Docker (development)

The dev compose file mounts source code and runs services with hot-reload:
- API: `ts-node-dev`
- Web: Next.js dev server
- Worker: `air` (Go hot-reload)

---

## 15. Git Workflow & Conventions

### Branch Strategy

```
main              ← production-ready code
develop           ← integration branch
feature/*         ← new features (from develop)
fix/*             ← bug fixes (from develop)
hotfix/*          ← urgent fixes (from main)
release/v*        ← release preparation
```

### Pull Request Process

1. Branch from `develop`
2. Write code + tests
3. Run `pnpm lint && pnpm test`
4. Open PR against `develop`
5. At least 1 reviewer approval required
6. Squash & merge

### Release Process

```bash
# Create release branch
git checkout -b release/v1.2.0 develop

# Bump versions
pnpm version 1.2.0 --workspaces

# Update CHANGELOG.md

# Merge to main + tag
git tag v1.2.0
git push origin v1.2.0
```

---

## 16. Debugging Tips

### API not connecting to database

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection manually
psql $DATABASE_URL -c "SELECT 1"

# Check Prisma can connect
cd apps/api && pnpm prisma db pull
```

### Worker not picking up checks

```bash
# Inspect Redis queue
redis-cli -u $REDIS_URL ZRANGE monitor:schedule 0 -1 WITHSCORES

# Check worker logs
docker logs netpulse-worker -f
```

### 401 Unauthorized on API calls

```bash
# Decode your JWT (paste at jwt.io)
# Check expiry, org_id, role claims
# Ensure FRONTEND_URL in API .env matches your frontend origin
```

### Database migration issues

```bash
# Check migration status
pnpm prisma migrate status

# If drift detected, reset dev DB
pnpm prisma migrate reset
```

### SMTP not sending

```bash
# Test SMTP config
node -e "
const nodemailer = require('nodemailer')
const t = nodemailer.createTransport({ host: process.env.SMTP_HOST, ... })
t.verify(console.log)
"
```

---

## 🆘 Getting Help

- **GitHub Discussions** — questions, ideas, design proposals
- **GitHub Issues** — bugs, feature requests
- **Discord** — community chat (link in README)

When reporting a bug, please include:
- OS and Node/Go version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (sanitize any secrets!)

---

*Happy coding! 🚀 — The NetPulse UpGuardX Team*
