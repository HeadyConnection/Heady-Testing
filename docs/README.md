# 📖 Heady™ Documentation Hub

> **Your central index to every guide, reference, runbook, and design decision in the Heady ecosystem.**
>
> New here? Follow this path: [Quick Start](#-getting-started) → [Pick a Quickstart](#-quickstart-guides) → [Explore Architecture](#️-architecture)

---

## 🚀 Getting Started

| Resource | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview, quick start, and API summary |
| [START_HERE.md](../START_HERE.md) | Master build guide — HeadyBuddy, HeadyAI-IDE, HeadyWeb, CLI |
| [Developer Onboarding](onboarding/developer-onboarding.md) | First-day orientation for new contributors |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to contribute, PR guidelines, code standards |

---

## 📦 Quickstart Guides

Step-by-step guides to get each Heady application running:

| Guide | What You'll Build | Time |
|-------|-------------------|------|
| [HeadyBuddy](quickstarts/HEADYBUDDY.md) | AI companion overlay for desktop + mobile | 2-3 hrs |
| [HeadyAI-IDE](quickstarts/HEADYIDE.md) | Custom VS Code-based IDE with built-in AI | 3-4 hrs |
| [HeadyBrowser](quickstarts/HEADYBROWSER.md) | Privacy-first Chromium browser with HeadyBuddy | 4-6 hrs |
| [HeadyServices](quickstarts/HEADYSERVICES.md) | Backend services deployment | 1-2 hrs |
| [Heady API](quickstarts/HEADY_API_QUICKSTART.md) | API integration & service interaction | 30 min |
| [HeadyMCP](quickstarts/HEADYMCP.md) | Model Context Protocol server setup | 1 hr |

---

## 🏗️ Architecture

| Document | Scope |
|----------|-------|
| [Architecture v5.0](../ARCHITECTURE.md) | Full layer architecture — bootstrap through auto-success engine, φ-constants, CSL gate thresholds, module dependency graph |
| [Architecture Overview](ARCHITECTURE.md) | Edge-first topology — Cloudflare Workers + Cloud Run split |
| [System Topology](architecture/system-topology.md) | Service layout and network boundaries |
| [C4 Architecture](C4_ARCHITECTURE.md) | C4 model — context, containers, components, code |
| [Dependency Graph](DEPENDENCY_GRAPH.md) | Module interdependencies |
| [Infrastructure Setup](INFRASTRUCTURE_SETUP.md) | Docker, Cloudflare, Cloud Run, database setup |
| [Cross-Platform Protocol](HEADY_CROSS_PLATFORM_PROTOCOL.md) | Desktop, mobile, browser, boot-drive integration |
| [Stack Distribution](HEADY_STACK_DISTRIBUTION_PROTOCOL.md) | How components are distributed across platforms |

### C4 Diagrams (PlantUML)

| Diagram | Level |
|---------|-------|
| [System Context](c4-level1-system-context.puml) | L1 — users & external systems |
| [Containers](c4-level2-containers.puml) | L2 — services & data stores |
| [Memory Domain](c4-level3-memory-domain.puml) | L3 — vector memory internals |
| [CSL Engine](c4-level4-csl-engine.puml) | L4 — CSL gate operations |

---

## 🔌 API Reference

| Document | Coverage |
|----------|----------|
| [HeadyManager API](api/HEADYMANAGER_API.md) | Full endpoint reference for the HeadyManager service |
| [API Overview](api/api-overview.md) | High-level summary of all API surfaces |
| [API Reference](api/api-reference.md) | Endpoints, parameters, and response formats |
| [OpenAPI Spec](api/openapi.yaml) | Machine-readable API definition |
| [Postman Collection](postman-collection.json) | Import-ready collection for Postman |

---

## 🔧 Operations & Runbooks

### Deployment

| Runbook | When to Use |
|---------|-------------|
| [Deployment Runbook](runbooks/deployment-runbook.md) | Standard deployment procedure |
| [Deployment Rollback](runbooks/deployment-rollback.md) | Rolling back a failed deploy |
| [HCFP Auto-Deployment](HCFP_AUTO_DEPLOYMENT.md) | Automated pipeline deployment |
| [HeadyVM Auto-Deploy](HEADYVM_AUTODEPLOY_GUIDE.md) | VM-based automated deployment |

### Incident Response

| Runbook | When to Use |
|---------|-------------|
| [General Incident](runbooks/general-incident.md) | Standard incident response playbook |
| [Emergency Runbook](runbooks/emergency-runbook.md) | Critical system failure response |
| [Service Recovery](runbooks/RUNBOOK-service-recovery.md) | Recovering a failed service |
| [Service Failure](runbooks/service-failure.md) | Diagnosing service failures |
| [Security Incident](runbooks/security-incident.md) | Security breach response |

### Service-Specific

| Runbook | Service |
|---------|---------|
| [Heady Brain 503](runbooks/heady-brain-503.md) | Brain service returning 503 |
| [Heady Brain Runbook](runbooks/heady-brain-runbook.md) | Brain service operations |
| [Heady Memory Degraded](runbooks/heady-memory-degraded.md) | Memory service performance issues |
| [API Gateway Overload](runbooks/api-gateway-overload.md) | Gateway throttling & overload |
| [Search Service](runbooks/search-service.md) | Search service operations |

### Database & Monitoring

| Runbook | When to Use |
|---------|-------------|
| [Database Operations](runbooks/RUNBOOK-database-operations.md) | Daily DB ops & maintenance |
| [Database Recovery](runbooks/database-recovery.md) | Recovering from data loss |
| [Monitoring Alerts](runbooks/RUNBOOK-monitoring-alerts.md) | Alert triage & response |
| [Monitoring Runbook](runbooks/monitoring-runbook.md) | Monitoring setup & checks |

### Auth

| Runbook | When to Use |
|---------|-------------|
| [Auth Runbook](runbooks/auth-runbook.md) | Auth service operations |
| [Auth Session Failure](runbooks/auth-session-failure.md) | Session broken / not persisting |
| [Auth Session Server](runbooks/auth-session-server.md) | Session server configuration |
| [Colab Gateway Runbook](runbooks/colab-gateway-runbook.md) | Colab integration issues |

---

## 🔒 Security

| Document | Coverage |
|----------|----------|
| [SECURITY.md](../SECURITY.md) | Vulnerability reporting & security policies |
| [Security Model](SECURITY_MODEL.md) | Auth boundaries, trust zones, access control |
| [Security Model (detailed)](security/security-model.md) | Full security model implementation |
| [Zero-Trust Posture](security/zero-trust-posture.md) | Zero-trust design principles |
| [Cloudflare Auth](cloudflare-worker-auth.md) | Cloudflare Worker auth configuration |
| [Cloudflare Credentials](cloudflare-credentials.md) | Cloudflare credential management |

---

## 📐 Architecture Decision Records (ADRs)

Design decisions that govern the system. Listed by topic.

### Core Decisions (`adr/`)

| ADR | Decision |
|-----|----------|
| [001](adr/001-fifty-services-architecture.md) | 50-service microservice architecture |
| [002](adr/002-phi-scaling-no-magic-numbers.md) | φ-scaling: no magic numbers allowed |
| [003](adr/003-pgvector-over-pinecone.md) | pgvector over Pinecone for vector storage |
| [004](adr/004-firebase-auth.md) | Firebase for authentication |
| [005](adr/005-csl-over-boolean.md) | CSL over Boolean logic |
| [006](adr/006-drupal-cms.md) | Drupal as CMS layer |
| [007](adr/007-concurrent-equals.md) | Concurrent-equals execution model |
| [008](adr/008-sacred-geometry.md) | Sacred Geometry as design principle |
| [009](adr/009-envoy-mtls.md) | Envoy mTLS for service mesh |
| [010](adr/010-multi-model-orchestration.md) | Multi-model AI orchestration |

### Expanded ADRs (`adr/ADR-*`)

| ADR | Decision |
|-----|----------|
| [ADR-001](adr/ADR-001-liquid-latent-os-architecture.md) | Liquid Latent OS architecture |
| [ADR-002](adr/ADR-002-phi-math-foundation.md) | φ-math foundation |
| [ADR-003](adr/ADR-003-continuous-semantic-logic-engine.md) | CSL engine design |
| [ADR-004](adr/ADR-004-circuit-breaker-resilience.md) | Circuit breaker resilience patterns |
| [ADR-005](adr/ADR-005-nats-jetstream-event-backbone.md) | NATS JetStream event backbone |
| [ADR-006](adr/ADR-006-self-healing-lifecycle.md) | Self-healing lifecycle |
| [ADR-007](adr/ADR-007-zero-trust-security-model.md) | Zero-trust security model |
| [ADR-008](adr/ADR-008-structured-json-observability.md) | Structured JSON observability |

### Why Decisions (`adrs/`)

| ADR | Rationale |
|-----|-----------|
| [001](adrs/001-phi-math-foundation.md) | Why φ-math foundation |
| [002](adrs/002-csl-replaces-boolean.md) | Why CSL replaces Boolean logic |
| [003](adrs/003-httponly-cookies-only.md) | Why HttpOnly cookies only |
| [004](adrs/004-esm-exports-only.md) | Why ESM exports only |
| [005](adrs/005-sacred-geometry-topology.md) | Why Sacred Geometry topology |
| [006](adrs/006-zero-trust-security.md) | Why zero-trust security |
| [007](adrs/007-concurrent-equals-language.md) | Why concurrent-equals language |
| [013](adrs/013-why-50-microservices.md) | Why 50 microservices |
| [014](adrs/014-why-drupal-cms.md) | Why Drupal CMS |
| [015](adrs/015-why-pgvector.md) | Why pgvector |
| [016](adrs/016-why-firebase-auth.md) | Why Firebase Auth |
| [017](adrs/017-why-csl-geometric-logic.md) | Why CSL geometric logic |
| [018](adrs/018-why-sacred-geometry-constants.md) | Why Sacred Geometry constants |

---

## 🐛 Debug Guides

Troubleshooting guides organized by domain:

| Guide | Domain |
|-------|--------|
| [Agents](debug/agents.md) | Agent behavior & lifecycle |
| [Inference](debug/inference.md) | Model inference issues |
| [Integration](debug/integration.md) | Service integration problems |
| [Memory](debug/memory.md) | Vector memory & embeddings |
| [Monitoring](debug/monitoring.md) | Metrics & alerting |
| [Orchestration](debug/orchestration.md) | Conductor & scheduler |
| [Security](debug/security.md) | Auth & access issues |
| [Web](debug/web.md) | Frontend & browser issues |
| [Service Debug Guide](SERVICE_DEBUG_GUIDE.md) | Comprehensive service debugging reference |

---

## 📊 Status & Reports

| Document | Contents |
|----------|----------|
| [System Status Overview](SYSTEM_STATUS_OVERVIEW.md) | Current system health & status |
| [Gaps Found](GAPS_FOUND.md) | Known gaps and improvement areas |
| [Improvements](IMPROVEMENTS.md) | Completed and planned improvements |
| [Error Codes](ERROR_CODES.md) | Full error code catalog |
| [Error Reporting Rules](ERROR_REPORTING_RULES.md) | How to report and categorize errors |
| [Changelog](CHANGELOG.md) | Version history |

---

## 🎨 Brand & Design

| Document | Coverage |
|----------|----------|
| [Brand Architecture Guide](BRAND_ARCHITECTURE_GUIDE.md) | Naming standards, identity, design system |
| [Naming Standards](HEADY_NAMING_STANDARDS.md) | Component naming conventions |
| [URL & Domain Style Guide](URL_DOMAIN_STYLE_GUIDE.md) | Domain routing, URL patterns |
| [Pattern Library](Pattern-Library.md) | Reusable UI/code patterns |

---

## 🧠 Specialized Guides

| Document | Topic |
|----------|-------|
| [HeadyBuddy Guide](../HEADYBUDDY_GUIDE.md) | AI companion deep-dive |
| [HeadyAI-IDE Guide](../HEADYAI_IDE_GUIDE.md) | IDE integration deep-dive |
| [Heady Auto-IDE](HEADY_AUTO_IDE.md) | Automated IDE setup |
| [Browser Buddy IDE Protocol](HEADY_BROWSER_BUDDY_IDE_PROTOCOL.md) | Browser ↔ IDE integration protocol |
| [Imagination Engine](IMAGINATION_ENGINE.md) | Creative AI capabilities |
| [Multi-Agent Transparency](MULTI_AGENT_TRANSPARENCY.md) | Agent visibility & auditability |
| [Codemap Skill Integration](CODEMAP_SKILL_INTEGRATION.md) | Skill system integration |
| [Model Integration](MODEL_INTEGRATION.md) | Adding new AI models |
| [IDE Integration](IDE_INTEGRATION.md) | IDE connector setup |
| [HeadyVM Setup Guide](HeadyVM-Setup-Guide.md) | Virtual machine environment |
| [Heady Commands Guide](Heady-Commands-Guide.md) | Full CLI command reference |
| [Services Manual](heady-services-manual.md) | Complete services reference (43KB) |
| [Patent Map](PATENT_MAP.md) | IP coverage — 60+ provisional patents |

---

## 📁 Other References

| Document | Contents |
|----------|----------|
| [DOC_OWNERS.yaml](DOC_OWNERS.yaml) | Document ownership & review assignments |
| [Backup Strategy](backup-strategy.md) | Data backup & recovery procedures |
| [Skills Summary](skills-summary.md) | Agent skill catalog |
| [External Skills Research](external-skills-research.md) | Research on external skill integration |
| [Public Sources](PUBLIC_SOURCES.md) | Public-facing data sources |
| [Arena Mode Spec](ARENA_MODE_SPEC.md) | Competitive AI evaluation spec |
| [Learning Log](LEARNING_LOG.md) | System learning & adaptation history |

---

*Navigate back to [README.md](../README.md) · Updated March 2026*
