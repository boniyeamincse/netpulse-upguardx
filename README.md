# 🛡️ NetPulse – UpGuardX

**Smart Uptime Monitoring & Security Visibility Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](docs/deployment/docker.md)
[![Status](https://img.shields.io/badge/status-planning-orange.svg)]()

NetPulse UpGuardX is an open-source, self-hostable uptime monitoring and security visibility platform. Monitor websites, servers, APIs, ports, DNS, and SSL certificates in real time — with smart alerting, role-based access, public status pages, and deep infrastructure insights.

---

## ✨ Features at a Glance

| Category | Highlights |
|---|---|
| 🟢 Uptime Monitoring | HTTP/HTTPS, TCP, ICMP, DNS, SSL, custom intervals |
| 🔐 Security Monitoring | Brute-force detection, port change alerts, WAF integration |
| 🖥️ Infrastructure | CPU, RAM, Disk, Docker, Cloud VMs |
| 📋 Log Monitoring | Centralized logs, error detection, SIEM-ready |
| 🔔 Smart Alerts | Email, Telegram, Slack, Discord, SMS, Webhooks |
| 🌐 Status Page | Public page, custom domain, branding, incidents |
| 👥 RBAC | Super Admin, Admin, Viewer, API keys, Org-based |
| 🏢 Multi-Org | MSP mode, per-company dashboards |
| 📊 Reporting | PDF/CSV reports, SLA monitoring, uptime % |

---

## 🚀 Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/boniyeamincse/netpulse-upguardx.git
cd netpulse-upguardx
cp .env.example .env
docker-compose up -d
```

Then visit `http://localhost:3000` and log in with the default admin credentials printed in the terminal.

### Standalone Linux

```bash
curl -sSL https://install.netpulse.io | bash
```

See the [Installation Guide](docs/deployment/linux.md) for full details.

---

## 📁 Project Structure

```
netpulse-upguardx/
├── apps/
│   ├── web/              # Frontend (Next.js / React)
│   ├── api/              # Backend API (Node.js / TypeScript)
│   ├── worker/           # Monitor worker service (Go / Rust)
│   └── agent/            # Host agent (Go)
├── packages/
│   ├── ui/               # Shared UI components
│   ├── config/           # Shared config/env schemas
│   └── types/            # Shared TypeScript types
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   └── terraform/
├── docs/
│   ├── architecture/
│   ├── api/
│   └── deployment/
└── scripts/
```

---

## 📖 Documentation

- [Architecture Blueprint](docs/blueprint/BLUEPRINT.md)
- [Developer Guide](docs/developer/DEVELOPER.md)
- [API Reference](docs/api/README.md)
- [Deployment Guide](docs/deployment/README.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TailwindCSS, TypeScript |
| Backend API | Node.js, Express / Fastify, TypeScript |
| Worker / Agent | Go or Rust (high-performance probing) |
| Database | PostgreSQL (primary), Redis (cache/queues) |
| Queue | BullMQ / Redis |
| Auth | JWT + 2FA (TOTP), OAuth2 (optional) |
| Notifications | Nodemailer, Twilio, custom webhooks |
| Deployment | Docker, Kubernetes, standalone Linux |

---

## 🤝 Contributing

We welcome contributions of all kinds! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 🔐 Security

If you discover a security vulnerability, please see our [Security Policy](SECURITY.md) and report it responsibly. Do **not** open a public GitHub issue for security bugs.

---

## 📜 License

NetPulse UpGuardX is released under the [MIT License](LICENSE).

---

## 🌟 Star History

If you find this project useful, please give it a ⭐ — it helps more people discover the project!

---

> Built with ❤️ for the open-source community. Self-host, own your data, monitor everything.
