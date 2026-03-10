<<<<<<< HEAD
# 🧠 Heady — The Latent OS
=======
<<<<<<< HEAD
<!-- HEADY_BRAND:BEGIN
<!-- ╔══════════════════════════════════════════════════════════════════╗
<!-- ║  ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗                     ║
<!-- ║  ██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝                     ║
<!-- ║  ███████║█████╗  ███████║██║  ██║ ╚████╔╝                      ║
<!-- ║  ██╔══██║██╔══╝  ██╔══██║██║  ██║  ╚██╔╝                       ║
<!-- ║  ██║  ██║███████╗██║  ██║██████╔╝   ██║                        ║
<!-- ║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝                        ║
<!-- ║                                                                  ║
<!-- ║  ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces    ║
<!-- ║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
<!-- ║  FILE: README.md                                                    ║
<!-- ║  LAYER: root                                                  ║
<!-- ╚══════════════════════════════════════════════════════════════════╝
<!-- HEADY_BRAND:END
-->
=======
>>>>>>> a3d7d06c432bf92df85e53f8d0cf1e6c8622ccea
# Heady Systems
>>>>>>> f1ab914a56ebb387b9669c4d2f46e3c53f393edd

> Self-aware, self-correcting intelligence infrastructure.
> 20 AI nodes · 12-stage pipeline · Monte Carlo validation · Sacred Geometry at every layer.

[![License](https://img.shields.io/badge/license-Proprietary-blue)]()
[![Node](https://img.shields.io/badge/node-20%2B-green)]()
[![MCP](https://img.shields.io/badge/MCP-v3.2_Orion-purple)]()

<<<<<<< HEAD
## 🚀 System Status: 100% FULLY FUNCTIONAL

**HeadyCloud is live and operational** with complete auto-deployment capabilities. All services are running at optimal performance with 100% HeadyBrain dominance and persistent memory integration.

### ✅ Live Services
- **HeadyCloud API**: https://headysystems.com/api
- **HeadyManager**: https://headysystems.com/manager  
- **Registry Service**: https://headysystems.com/registry
- **Brain Service**: https://brain.headysystems.com
- **Auto-Deploy Pipeline**: Active and operational

### 🎯 Quick Start (Cloud-First)

```bash
# Clone and auto-deploy
git clone https://github.com/HeadySystems/Heady.git
cd Heady
./scripts/run-auto-deploy.ps1 -ForceProduction
```

**All services automatically deploy to HeadyCloud** - no local setup required.

### 🧠 Intelligent Features

- **100% HeadyBrain Dominance**: All operations routed through HeadyBrain
- **Persistent Memory System**: Deep data scanning with pre-execution optimization
- **Adaptive Complexity**: Intelligent orchestration based on task requirements
- **Monte Carlo Optimization**: Real-time performance optimization
- **Pattern Recognition**: Self-learning system with continuous improvement

## Quickstart Guides

Get started with Heady applications:

- [HeadyBuddy](docs/quickstarts/HEADYBUDDY.md) - Android companion
- [HeadyIDE](docs/quickstarts/HEADYIDE.md) - Desktop AI assistant
- [HeadyBrowser](docs/quickstarts/HEADYBROWSER.md) - Web extension
- [HeadyServices](docs/quickstarts/HEADYSERVICES.md) - Backend system
- [Heady API](docs/quickstarts/HEADY_API_QUICKSTART.md) - Service interaction
- [HeadyMCP](docs/quickstarts/HEADYMCP.md) - Manager Control Plane

## Guides and References

Deeper integration and API documentation:

- [Service Integration](docs/guides/SERVICE_INTEGRATION.md) - How Heady services connect
- [HeadyManager API](docs/api/HEADYMANAGER_API.md) - Service endpoints reference

=======
## Quick Start

```bash
git clone https://github.com/HeadyMe/Heady-8f71ffc8.git ~/Heady
cd ~/Heady
cp .env.example .env          # fill in API keys
npm install
node heady-manager.js          # http://localhost:3301
```

<<<<<<< HEAD
### Container

```bash
podman build -t heady:latest .
podman run -d -p 3301:3301 -v heady-data:/app/data heady:latest
=======
>>>>>>> a3d7d06c432bf92df85e53f8d0cf1e6c8622ccea
## Architecture

```
heady-manager.js          # Node.js MCP Server & API Gateway (port 3300)
├── src/                  # Core pipeline engine & agents
├── backend/              # Python worker & MCP servers
├── frontend/             # React UI (Vite + TailwindCSS)
<<<<<<< HEAD
├── HeadyAcademy/         # AI Nodes & Tools (JULES, OBSERVER, BUILDER, ATLAS, PYTHIA)
├── configs/              # YAML configuration (pipeline, resources, governance)
├── scripts/              # Automation (Sync, Build, Deploy, Checkpoint)
├── notebooks/            # Colab notebooks (quick-start, tutorials, examples)
├── docs/                 # Documentation & Notion templates
└── heady-registry.json   # HeadyRegistry — central catalog of the ecosystem
=======
├── HeadyAcademy/         # AI Nodes & Tools
├── configs/              # YAML configuration
├── scripts/              # Automation (Sync, Build, Deploy)
└── workers/              # Edge workers
>>>>>>> a3d7d06c432bf92df85e53f8d0cf1e6c8622ccea
>>>>>>> f1ab914a56ebb387b9669c4d2f46e3c53f393edd
```

## Architecture at a Glance

```
┌──────────────────────────────────────────────────────┐
│                    AI GATEWAY                         │
│          (Auth · Rate Limit · Router)                 │
└──────────┬───────────────────────────┬───────────────┘
           │                           │
     ┌─────▼─────┐             ┌───────▼───────┐
     │ HeadyBrain │────────────▶  HeadySoul    │
     │ (Reasoning)│             │ (Alignment)  │
     └─────┬─────┘             └───────┬───────┘
           │                           │
     ┌─────▼─────────────────────────▼──────┐
     │           HeadyBattle (QA Gate)       │
     │  HeadySims (Monte Carlo Validation)   │
     └──────────────┬───────────────────────┘
                    │
     ┌──────────────▼──────────────────────┐
     │         Arena Mode (A/B Eval)        │
     │   Winners auto-promoted to prod      │
     └──────────────┬──────────────────────┘
                    │
     ┌──────────────▼──────────────────────┐
     │         HeadyVinci (Learning)        │
     │     Pattern spotting & memory        │
     └─────────────────────────────────────┘
```

## Agent Roster

| Category | Agents |
|---|---|
<<<<<<< HEAD
| **Thinkers** | HeadyBrain, HeadySoul, HeadyVinci |
| **Builders** | HeadyCoder, HeadyCodex, HeadyCopilot, HeadyJules |
| **Validators** | HeadyPerplexity, HeadyGrok, HeadyBattle, HeadySims |
| **Creatives** | HeadyCreative, HeadyVinci Canvas |
| **Ops** | HeadyManager, HeadyConductor, HeadyLens, HeadyOps, HeadyMaintenance |
| **Assistant** | HeadyBuddy |

## Domains
=======
| `GET /api/health` | Health check |
| `GET /api/pulse` | System pulse with layer info |
| `GET /api/system/status` | Full system status |
| `POST /api/pipeline/run` | Trigger pipeline run |
| `GET /api/pipeline/state` | Current pipeline state |
| `GET /api/nodes` | List all AI nodes |
<<<<<<< HEAD
| `GET /api/registry` | Full HeadyRegistry catalog |
| `GET /api/registry/component/:id` | Lookup a specific component |
| `GET /api/registry/environments` | List all environments |
| `GET /api/registry/docs` | List registered documents |
| `GET /api/registry/notebooks` | List registered notebooks |
| `GET /api/registry/patterns` | List architecture patterns |
| `GET /api/registry/workflows` | List workflows |
| `GET /api/registry/ai-nodes` | List AI nodes from registry |

## CLI Interface

The Heady CLI provides command-line access to Heady services:

```bash
# Set API key (or add to .env)
export HEADY_API_KEY="your_api_key"

# Run CLI
npm run cli
# or directly:
python scripts/heady_cli.py
```

See [scripts/heady_cli.md](scripts/heady_cli.md) for full documentation.

## Checkpoint Protocol
>>>>>>> f1ab914a56ebb387b9669c4d2f46e3c53f393edd

| Domain | Purpose |
|---|---|
| headyme.com | Personal dashboard / Command Center |
| headysystems.com | Infrastructure hub |
| headyconnection.org | Nonprofit community |
| headymcp.com | MCP Protocol portal |
| headyio.com | Developer platform |
| headybuddy.org | Assistant hub |
| headybot.com | Automation |
| headyapi.com | Public API gateway |

## Tech Stack

- **Runtime**: Node.js 20 (Express)
- **Frontend**: React + Vite
- **Local AI**: Ollama
- **Cloud AI**: Gemini, Claude, GPT, Groq, Perplexity
- **Infra**: Cloudflare (DNS, Tunnels, Workers, KV, Pages, Access), GCP (Vertex AI, Cloud Run, Storage)
- **CI/CD**: GitHub Actions → Cloudflare Pages / Cloud Run

## Contributing

<<<<<<< HEAD
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Proprietary — HeadySystems Inc. & HeadyConnection Inc.
=======
## Notebooks

Colab notebooks are stored under `notebooks/` and validated in CI:

| Notebook | Purpose |
|----------|---------|
| `notebooks/quick-start/heady-quick-start.ipynb` | Fast system orientation |
| `notebooks/tutorials/hcfullpipeline-walkthrough.ipynb` | Pipeline deep-dive |
| `notebooks/examples/registry-api-demo.ipynb` | Registry API examples |

## Key Documentation

| Path | Purpose |
|------|---------|
| `docs/CHECKPOINT_PROTOCOL.md` | Master protocol for keeping all files in sync |
| `docs/DOC_OWNERS.yaml` | Document ownership & review tracker |
| `docs/notion-quick-start.md` | Notion Quick Start template |
| `docs/notion-project-notebook.md` | Notion Project Notebook template |
| `docs/heady-services-manual.md` | Comprehensive services manual |
| `CLAUDE.md` | Claude Code integration protocol |

## Python & Colab Development

This project supports Python development with PyCharm and Google Colab integration.

### Project Structure

```
data/                    # Data directories
├── raw/                # Raw data files (git-ignored)
├── processed/          # Processed data
└── external/           # External data (git-ignored)

notebooks/              # Jupyter notebooks
├── exploratory/        # Scratch, EDA, experiments
├── reports/            # Clean, final notebooks
├── archive/            # Retired notebooks
└── figures/            # Exported plots/images

src/                    # Reusable Python code
tests/                  # Unit tests
```

### Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# For PyCharm: Open as Python project
# For Colab: See COLAB_WORKFLOW.md
```

### Key Files

- `requirements.txt` - Python dependencies
- `NOTEBOOK_TEMPLATE.md` - Template for new notebooks
- `COLAB_WORKFLOW.md` - Google Colab workflow guide
- `.env.example` - Environment variables template
=======
| `POST /api/system/production` | Activate production mode |
>>>>>>> a3d7d06c432bf92df85e53f8d0cf1e6c8622ccea

## Deployment

Deployed via [Render.com](https://render.com) using `render.yaml`.

## License

Proprietary - Heady Systems
<<<<<<< HEAD

=======
>>>>>>> a3d7d06c432bf92df85e53f8d0cf1e6c8622ccea
>>>>>>> f1ab914a56ebb387b9669c4d2f46e3c53f393edd
