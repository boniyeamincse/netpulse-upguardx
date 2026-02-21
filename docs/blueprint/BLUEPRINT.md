# 🏗️ NetPulse UpGuardX — Full Architecture Blueprint

> Version: 1.0.0-planning  
> Status: Draft  
> License: MIT

---

## Table of Contents

1. [Vision & Goals](#1-vision--goals)
2. [System Overview](#2-system-overview)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Core Services](#4-core-services)
5. [Database Schema Design](#5-database-schema-design)
6. [API Design](#6-api-design)
7. [Monitoring Engine](#7-monitoring-engine)
8. [Alerting Pipeline](#8-alerting-pipeline)
9. [Security Architecture](#9-security-architecture)
10. [Public Status Page](#10-public-status-page)
11. [Multi-Organization Design](#11-multi-organization-design)
12. [Agent Architecture](#12-agent-architecture)
13. [Reporting Engine](#13-reporting-engine)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Scalability & Performance](#15-scalability--performance)
16. [Roadmap](#16-roadmap)

---

## 1. Vision & Goals

### Mission
NetPulse UpGuardX provides organizations with a unified, self-hostable platform to monitor uptime, infrastructure health, and basic security signals — with full data ownership and zero vendor lock-in.

### Design Principles
- **Privacy first** — self-hostable, no telemetry by default
- **Modular architecture** — each service can be scaled or replaced independently
- **Developer friendly** — REST API, webhooks, open schemas
- **Security by design** — encrypted secrets, audit logs, TLS everywhere
- **Minimal ops overhead** — Docker-first, one-command deploy

### Non-Goals (v1)
- Full SIEM / log aggregation at enterprise scale
- Network topology mapping
- Synthetic browser testing (planned v2)

---

## 2. System Overview

NetPulse UpGuardX is composed of five core subsystems:

```
┌─────────────────────────────────────────────────────┐
│                    USER INTERFACES                   │
│    Web Dashboard  │  Public Status Page  │  REST API │
└─────────┬────────────────┬──────────────────┬────────┘
          │                │                  │
┌─────────▼────────────────▼──────────────────▼────────┐
│                    API GATEWAY (Node.js)               │
│         Auth  │  Rate Limiting  │  RBAC  │  Routing   │
└─────────┬──────────────────────────────────┬──────────┘
          │                                  │
┌─────────▼──────────┐         ┌─────────────▼──────────┐
│   CORE API SERVICE │         │    WORKER SERVICE        │
│  (Business Logic)  │◄───────►│  (Monitor Engine / Go)  │
└─────────┬──────────┘         └─────────────┬───────────┘
          │                                  │
┌─────────▼──────────────────────────────────▼──────────┐
│                   DATA LAYER                           │
│    PostgreSQL (primary)  │  Redis (cache + queues)     │
└────────────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────┐
│                EXTERNAL SERVICES                        │
│  Email  │  Twilio SMS  │  Telegram  │  Slack  │ Discord │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Architecture Diagram

### Request Flow

```
User Browser
    │
    ▼
[CDN / Reverse Proxy (Nginx / Caddy)]
    │
    ├──► [Next.js Frontend] ──► Static Assets / SSR
    │
    └──► [API Gateway :3001]
              │
              ├── Auth Middleware (JWT / API Key)
              ├── RBAC Check
              ├── Rate Limiter (Redis)
              │
              ▼
         [Core API Service]
              │
              ├──► [PostgreSQL] — persisted data
              ├──► [Redis Queue] — jobs & cache
              └──► [Worker Service] — schedule & probe

Worker Service
    │
    ├── Poll Redis Queue for due checks
    ├── Execute probes (HTTP, TCP, ICMP, DNS, SSL)
    ├── Write results to PostgreSQL
    ├── Evaluate alert rules
    └──► [Alert Dispatcher]
              │
              ├── Email (SMTP)
              ├── Telegram Bot API
              ├── Slack Webhook
              ├── Discord Webhook
              ├── Twilio SMS
              └── Custom Webhook
```

### Agent Flow (for server monitoring)

```
Remote Server
    │
    └── [NetPulse Agent (Go binary)]
              │
              ├── Collect: CPU, RAM, Disk, Network, Docker
              ├── Parse logs for patterns
              └──► HTTPS POST ──► [API Gateway]
```

---

## 4. Core Services

### 4.1 Web Frontend (`apps/web`)

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS + shadcn/ui
- **State:** Zustand + React Query (TanStack Query)
- **Charts:** Recharts / Chart.js
- **Auth:** NextAuth.js (session management)

Key pages:
- `/dashboard` — overview widgets
- `/monitors` — list, create, manage monitors
- `/incidents` — incident timeline
- `/status` — public status page builder
- `/settings` — org, RBAC, billing, API keys
- `/reports` — analytics, PDF export

### 4.2 Core API (`apps/api`)

- **Runtime:** Node.js 20 LTS
- **Framework:** Fastify (high-performance) or Express
- **Language:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Validation:** Zod
- **Auth:** JWT (access + refresh tokens), TOTP 2FA

Responsibilities:
- CRUD for all resources (monitors, alerts, users, orgs)
- Authentication and session management
- Webhook delivery management
- Report generation (PDF via Puppeteer or pdf-lib)
- API key issuance and validation

### 4.3 Worker / Monitor Engine (`apps/worker`)

- **Language:** Go (preferred for concurrency) or Rust
- **Queue:** Redis via `go-redis` + custom scheduler
- **Probes:**
  - HTTP/HTTPS — response time, status code, body match
  - TCP — connect check, port open/closed
  - ICMP (Ping) — round-trip latency
  - DNS — A, AAAA, MX, CNAME record checks
  - SSL — expiry date, cert chain validity, config
- **Scheduling:** Per-monitor configurable intervals (10s, 30s, 1m, 5m, 15m, 30m, 1h)

### 4.4 Agent (`apps/agent`)

- **Language:** Go (compiled binary, ~8MB)
- **Auth:** Pre-shared API key (TLS-encrypted)
- **Metrics collected:**
  - CPU usage (% per core + aggregate)
  - RAM usage (used / available / total)
  - Disk usage (per mount point)
  - Network I/O (bytes in/out per interface)
  - Docker container state (running, stopped, restarting)
  - Log file tailing (configurable paths)

---

## 5. Database Schema Design

### Primary Tables (PostgreSQL)

```sql
-- Organizations
organizations (
  id UUID PK,
  name TEXT,
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'free',
  custom_domain TEXT,
  branding JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Users
users (
  id UUID PK,
  org_id UUID FK organizations,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT CHECK (role IN ('super_admin','admin','viewer')),
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT false,
  ip_whitelist TEXT[],
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Monitors
monitors (
  id UUID PK,
  org_id UUID FK organizations,
  name TEXT,
  type TEXT CHECK (type IN ('http','https','tcp','icmp','dns','ssl')),
  target TEXT,
  interval_seconds INTEGER DEFAULT 60,
  timeout_seconds INTEGER DEFAULT 10,
  config JSONB,   -- type-specific options
  status TEXT DEFAULT 'active',
  is_paused BOOLEAN DEFAULT false,
  created_by UUID FK users,
  created_at TIMESTAMPTZ
)

-- Monitor Checks (time-series, consider TimescaleDB extension)
monitor_checks (
  id UUID PK,
  monitor_id UUID FK monitors,
  status TEXT CHECK (status IN ('up','down','degraded')),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ,
  region TEXT
)

-- Incidents
incidents (
  id UUID PK,
  monitor_id UUID FK monitors,
  org_id UUID FK organizations,
  title TEXT,
  status TEXT CHECK (status IN ('investigating','identified','monitoring','resolved')),
  started_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  root_cause TEXT,
  created_at TIMESTAMPTZ
)

-- Alert Channels
alert_channels (
  id UUID PK,
  org_id UUID FK organizations,
  name TEXT,
  type TEXT CHECK (type IN ('email','slack','telegram','discord','sms','webhook')),
  config JSONB,  -- encrypted credentials
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
)

-- Alert Rules
alert_rules (
  id UUID PK,
  monitor_id UUID FK monitors,
  channel_id UUID FK alert_channels,
  condition TEXT,
  cooldown_seconds INTEGER DEFAULT 300,
  escalation_minutes INTEGER,
  created_at TIMESTAMPTZ
)

-- Alert Events
alert_events (
  id UUID PK,
  rule_id UUID FK alert_rules,
  incident_id UUID FK incidents,
  sent_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('sent','failed','suppressed')),
  error TEXT
)

-- Server Agents
agents (
  id UUID PK,
  org_id UUID FK organizations,
  name TEXT,
  api_key_hash TEXT UNIQUE,
  last_seen_at TIMESTAMPTZ,
  ip_address INET,
  version TEXT,
  created_at TIMESTAMPTZ
)

-- Agent Metrics (time-series)
agent_metrics (
  id UUID PK,
  agent_id UUID FK agents,
  cpu_percent FLOAT,
  ram_percent FLOAT,
  disk_percent FLOAT,
  net_rx_bytes BIGINT,
  net_tx_bytes BIGINT,
  docker_containers JSONB,
  recorded_at TIMESTAMPTZ
)

-- Audit Logs
audit_logs (
  id UUID PK,
  org_id UUID FK organizations,
  user_id UUID FK users,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ
)

-- API Keys
api_keys (
  id UUID PK,
  org_id UUID FK organizations,
  created_by UUID FK users,
  name TEXT,
  key_prefix TEXT,
  key_hash TEXT UNIQUE,
  scopes TEXT[],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

### Redis Data Structures

```
monitor:schedule         → Sorted Set (monitor_id → next_run_timestamp)
monitor:lock:{id}        → String (distributed lock, TTL = interval)
alert:cooldown:{rule_id} → String (TTL = cooldown_seconds)
session:{token}          → Hash (user_id, org_id, role, expires_at)
ratelimit:{ip}:{route}   → String (counter, TTL = 60s)
check:queue              → List (pending checks)
```

---

## 6. API Design

### Base URL
```
https://api.yourdomain.com/v1
```

### Authentication
All endpoints (except public status pages) require:
```
Authorization: Bearer <jwt_token>
# OR
X-API-Key: <api_key>
```

### Core Endpoints

```
# Auth
POST   /v1/auth/register
POST   /v1/auth/login
POST   /v1/auth/logout
POST   /v1/auth/refresh
POST   /v1/auth/2fa/setup
POST   /v1/auth/2fa/verify

# Monitors
GET    /v1/monitors
POST   /v1/monitors
GET    /v1/monitors/:id
PUT    /v1/monitors/:id
DELETE /v1/monitors/:id
POST   /v1/monitors/:id/pause
POST   /v1/monitors/:id/resume
GET    /v1/monitors/:id/checks
GET    /v1/monitors/:id/uptime?period=30d

# Incidents
GET    /v1/incidents
POST   /v1/incidents
GET    /v1/incidents/:id
PATCH  /v1/incidents/:id
POST   /v1/incidents/:id/updates

# Alerts
GET    /v1/alert-channels
POST   /v1/alert-channels
PUT    /v1/alert-channels/:id
DELETE /v1/alert-channels/:id
POST   /v1/alert-channels/:id/test

GET    /v1/alert-rules
POST   /v1/alert-rules
PUT    /v1/alert-rules/:id
DELETE /v1/alert-rules/:id

# Agents
GET    /v1/agents
POST   /v1/agents                    # register new agent
DELETE /v1/agents/:id
POST   /v1/agents/:id/rotate-key

# Organizations
GET    /v1/org
PUT    /v1/org
GET    /v1/org/members
POST   /v1/org/members/invite
DELETE /v1/org/members/:id

# Reporting
GET    /v1/reports/uptime?from=&to=&monitor_id=
GET    /v1/reports/sla
GET    /v1/reports/export?format=pdf|csv

# Status Pages
GET    /v1/status-pages
POST   /v1/status-pages
PUT    /v1/status-pages/:id
DELETE /v1/status-pages/:id

# Public (no auth)
GET    /v1/public/status/:slug
GET    /v1/public/status/:slug/incidents

# API Keys
GET    /v1/api-keys
POST   /v1/api-keys
DELETE /v1/api-keys/:id

# Audit
GET    /v1/audit-logs
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 154
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "MONITOR_NOT_FOUND",
    "message": "Monitor with id xyz does not exist",
    "details": {}
  }
}
```

---

## 7. Monitoring Engine

### Check Lifecycle

```
Scheduler (Redis Sorted Set)
    │
    ▼ (due check dequeued)
Worker Pool (goroutines / threads)
    │
    ▼
Probe Executor
    ├── HTTP Probe
    │     └── GET/HEAD request → measure latency, check status, body pattern
    ├── TCP Probe
    │     └── dial(host:port) → check open/closed
    ├── ICMP Probe
    │     └── ping → measure RTT, packet loss
    ├── DNS Probe
    │     └── resolve record → compare expected vs actual
    └── SSL Probe
          └── TLS handshake → check cert expiry, issuer, chain
    │
    ▼
Result Evaluator
    ├── Compare to previous status
    ├── Determine: up / down / degraded
    └── Persist to monitor_checks
    │
    ▼
Incident Manager
    ├── If newly DOWN → create incident
    ├── If back UP → resolve incident, calculate downtime
    └── Emit event to Alert Dispatcher
```

### Probe Configuration Examples

```json
// HTTP Monitor
{
  "type": "http",
  "target": "https://example.com/api/health",
  "method": "GET",
  "expected_status": 200,
  "body_match": "\"status\":\"ok\"",
  "headers": { "Authorization": "Bearer token" },
  "follow_redirects": true,
  "timeout_seconds": 10
}

// SSL Monitor
{
  "type": "ssl",
  "target": "example.com",
  "port": 443,
  "alert_days_before_expiry": 30,
  "check_chain": true
}

// DNS Monitor
{
  "type": "dns",
  "target": "example.com",
  "record_type": "A",
  "expected_value": "93.184.216.34"
}
```

---

## 8. Alerting Pipeline

### Alert Flow

```
Incident Created / Status Changed
    │
    ▼
Alert Rule Evaluator
    ├── Find matching rules for this monitor
    ├── Check cooldown (Redis TTL)
    ├── Check escalation policy
    └── Dispatch to channels
    │
    ▼
Channel Dispatcher (async queue)
    ├── Email → SMTP (Nodemailer)
    ├── Slack → Incoming Webhook POST
    ├── Telegram → Bot API sendMessage
    ├── Discord → Webhook POST
    ├── SMS → Twilio REST API
    └── Custom → POST to user-defined URL
    │
    ▼
Delivery Tracker
    ├── Log delivery status
    ├── Retry on failure (max 3 attempts, exponential backoff)
    └── Mark suppressed if in cooldown
```

### Alert Payload (Webhook)

```json
{
  "event": "monitor.down",
  "monitor": {
    "id": "uuid",
    "name": "Production API",
    "type": "https",
    "target": "https://api.example.com"
  },
  "incident": {
    "id": "uuid",
    "started_at": "2025-01-01T12:00:00Z",
    "duration_seconds": 120
  },
  "org": {
    "id": "uuid",
    "name": "Acme Corp"
  },
  "timestamp": "2025-01-01T12:02:00Z"
}
```

---

## 9. Security Architecture

### Authentication

- Passwords hashed with **bcrypt** (cost 12)
- JWT access tokens (15 min TTL) + refresh tokens (7 days, stored in httpOnly cookie)
- **2FA:** TOTP (RFC 6238), compatible with Google Authenticator / Authy
- **IP Whitelist:** Per-user allowlist stored in `users.ip_whitelist`
- Login attempts rate-limited: 5 attempts per 10 minutes per IP

### Secrets Management

- Alert channel credentials (API keys, tokens) encrypted at rest using **AES-256-GCM**
- Encryption key loaded from environment variable (never stored in DB)
- Agent API keys stored as **bcrypt hashes** only

### API Security

- **Rate Limiting:** Per IP + per API key via Redis sliding window
- **CORS:** Strict origin allowlist
- **Helmet.js:** Standard HTTP security headers
- **Input Validation:** Zod schemas on all routes
- **SQL Injection:** Prevented via Prisma parameterized queries

### Agent Communication

- All agent → API communication over **TLS 1.3**
- Agent authenticates with API key in `X-Agent-Key` header
- Payloads signed with HMAC-SHA256

### Audit Logging

Every state-changing action logs:
- Who (user_id)
- What (action, resource_type, resource_id)
- When (timestamp)
- Where (IP, user_agent)
- Payload snapshot (before/after for updates)

---

## 10. Public Status Page

### Features
- Accessible at `https://status.yourdomain.com` or custom domain
- Per-organization, fully branded
- Shows current status of selected monitors
- Incident timeline with updates
- Maintenance window announcements
- Dark / Light theme toggle

### Custom Domain Flow

```
user's DNS CNAME → status.netpulse.io → Reverse Proxy
    → match Host header → load org by custom_domain → render
```

### Data served (public, no auth)
- Overall status (operational / degraded / outage)
- Per-service status (last check result)
- Open incidents (title, status, timeline)
- Uptime % for past 90 days (bar chart)
- Scheduled maintenance

---

## 11. Multi-Organization Design

### Isolation Model

All database tables include `org_id` as a foreign key. Every query in the API enforces an org filter derived from the authenticated user's JWT claims.

```typescript
// Enforced at middleware level
const orgId = req.user.orgId;
const monitors = await db.monitor.findMany({ where: { orgId } });
```

### MSP Mode

Managed Service Providers can:
- Create sub-organizations (clients)
- Switch between client dashboards
- Generate per-client reports
- Assign read-only Viewer access to clients

### Roles

| Role | Permissions |
|---|---|
| Super Admin | Full access across all orgs (platform level) |
| Admin | Full access within their org |
| Viewer | Read-only within their org |

---

## 12. Agent Architecture

### Agent Design

The agent is a **lightweight Go binary** deployed on monitored servers. It:
1. Collects system metrics every 30 seconds (configurable)
2. Tails configured log files for pattern matches
3. POSTs data to the NetPulse API over HTTPS

### Installation

```bash
# One-liner install
curl -sSL https://install.netpulse.io/agent | \
  AGENT_KEY=your_key API_URL=https://api.example.com bash
```

### Agent Config (`/etc/netpulse/agent.yaml`)

```yaml
api_url: https://api.example.com
api_key: your_agent_key
interval: 30
log_paths:
  - /var/log/nginx/access.log
  - /var/log/auth.log
log_patterns:
  - name: failed_login
    regex: "Failed password for"
    severity: warning
  - name: nginx_error
    regex: "\\[error\\]"
    severity: error
docker:
  enabled: true
```

---

## 13. Reporting Engine

### Uptime Calculation

```
uptime_percent = (total_checks - failed_checks) / total_checks * 100
```

Calculated per monitor, per time period (24h, 7d, 30d, 90d, custom).

### SLA Monitoring

Users define an SLA target (e.g., 99.9%). The system:
- Calculates actual uptime %
- Flags SLA breaches in reports
- Includes breach duration in PDF exports

### PDF Report Contents

- Cover page: org logo, period, generated date
- Executive summary (overall uptime %)
- Per-monitor breakdown table
- Incident list with durations and root causes
- SLA compliance section
- Trend charts (uptime over time per monitor)

Generated using **Puppeteer** (render HTML to PDF) or **pdf-lib**.

---

## 14. Deployment Architecture

### Docker Compose (Development / Small Deployments)

```yaml
services:
  web:        # Next.js frontend
  api:        # Core API
  worker:     # Monitor worker
  postgres:   # PostgreSQL
  redis:      # Redis
  caddy:      # Reverse proxy / TLS
```

### Kubernetes (Production)

```
Deployments:   web, api, worker
StatefulSets:  postgres, redis
Services:      ClusterIP for internal, LoadBalancer for web/api
Ingress:       Nginx / Traefik with cert-manager (Let's Encrypt)
ConfigMaps:    App configuration
Secrets:       DB passwords, JWT secrets, encryption keys
HPA:           Auto-scale api and worker pods based on CPU
```

### Environment Variables

```bash
# Core
DATABASE_URL=postgresql://user:pass@postgres:5432/netpulse
REDIS_URL=redis://redis:6379
JWT_SECRET=<strong-random-string>
ENCRYPTION_KEY=<32-byte-hex-key>

# Email
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@example.com
SMTP_PASS=<password>
SMTP_FROM=alerts@example.com

# Twilio
TWILIO_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE=+1234567890

# App
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
```

---

## 15. Scalability & Performance

### Horizontal Scaling

| Service | Scaling Strategy |
|---|---|
| `api` | Stateless, scale out behind load balancer |
| `worker` | Compete on Redis queue, scale out freely |
| `web` | CDN-cacheable, scale out |
| `postgres` | Read replicas for analytics queries |
| `redis` | Redis Cluster for high volume |

### Performance Targets (v1)

| Metric | Target |
|---|---|
| API response time (p99) | < 200ms |
| Check scheduling lag | < 5s |
| Alert delivery time | < 30s from incident |
| Dashboard load time | < 2s |
| Concurrent monitors (single node) | 10,000+ |

### Database Optimizations

- Partitioned `monitor_checks` table by month (TimescaleDB or native PG partitioning)
- Indexes on `(monitor_id, checked_at DESC)`, `(org_id, status)`
- Automatic data retention: compress/archive checks older than 90 days

---

## 16. Roadmap

### v1.0 — Foundation
- [ ] Core monitoring (HTTP, TCP, ICMP, DNS, SSL)
- [ ] Basic alerting (Email, Slack, Telegram, Discord, Webhook)
- [ ] Public status page
- [ ] RBAC (Admin, Viewer)
- [ ] Docker deployment
- [ ] REST API

### v1.5 — Infrastructure
- [ ] Server agent (CPU, RAM, Disk, Docker)
- [ ] Log monitoring (basic pattern matching)
- [ ] Uptime reports (PDF/CSV)
- [ ] SMS alerts (Twilio)
- [ ] Multi-organization support
- [ ] 2FA login
- [ ] Kubernetes manifests

### v2.0 — Security & Intelligence
- [ ] Suspicious downtime pattern detection (ML-based)
- [ ] Brute-force alert from log parsing
- [ ] WAF integration support
- [ ] SIEM integration (webhook-based)
- [ ] Synthetic browser testing (Playwright)
- [ ] MSP mode
- [ ] SLA dashboards

### v3.0 — Enterprise
- [ ] SSO / SAML
- [ ] Advanced SIEM integration
- [ ] Custom alerting scripting
- [ ] Global monitoring regions (distributed workers)
- [ ] White-label mode

---

*This blueprint is a living document. Open a GitHub Discussion to propose changes.*
