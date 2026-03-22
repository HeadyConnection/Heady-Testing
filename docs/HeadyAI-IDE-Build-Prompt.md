# HeadyAI-IDE — Optimal Build Prompt

> **Copy this prompt into your AI coding agent (Codex, Claude Code, Cursor, etc.) to build HeadyAI-IDE using the existing monorepo architecture and Windsurf-Next foundation.**

---

## System Prompt

You are building **HeadyAI-IDE** — an AI-powered development environment built on the **Windsurf-Next** (VS Code fork, v1.106.0-next) foundation. It features an integrated **HeadyBuddy AI companion sidebar**, **Sacred Geometry design**, **multi-model routing**, and deep integration with the Heady™ platform.

### What Already Exists (DO NOT recreate from scratch)

The monorepo at `Heady-Testing/` already contains:
- `HeadyAI-IDE/` — Root directory with README, initial scaffold
- `docs/HeadyAI-IDE-Fusion-Plan.md` — Full fusion strategy (Windsurf-Next → HeadyAI-IDE)
- `docs/HEADYAI_IDE_GUIDE.md` — 1200+ line comprehensive guide with code samples
- `docs/HEADY_AUTO_IDE.md` — Auto-IDE specification
- `docs/HEADY_AUTOIDE.md` — Complementary auto-IDE doc
- `docs/ARENA_MODE_SPEC.md` — Multi-model arena mode specification
- `configs/heady-ide.yaml` — IDE configuration
- `configs/INSTALLABLE_PACKAGES/HeadyAI-IDE/` — Installable package config
- `services/heady-web/remotes/heady-ide/` — Micro-frontend remote (for HeadyWeb embedding)
- `docs/benefit-pack/PRODUCT_SURFACES.md` — Product surface definition

### Architecture

```
HeadyAI-IDE (Windsurf-Next / VS Code Fork)
├── Electron Shell
│   ├── Main Process (Node.js)
│   │   ├── Extension Host
│   │   ├── HeadyBuddy Service
│   │   └── AI Model Router
│   └── Renderer Process (Chromium)
│       ├── Monaco Editor
│       ├── HeadyBuddy Sidebar (Webview)
│       ├── Sacred Geometry Theme
│       └── Impact Dashboard
├── Extension System
│   ├── HeadyBuddy Extension
│   │   ├── AI Chat Panel
│   │   ├── Code Actions (explain, test, fix, optimize)
│   │   └── Context-aware suggestions
│   ├── Sacred Geometry Theme Extension
│   ├── Experiment Tracker Extension
│   └── HeadyScript Language Extension
└── Service Layer
    ├── Heady Manager API client
    ├── Multi-model router (Brain, Conductor, Pattern, Critique)
    ├── Cross-device sync (HeadyCloud)
    └── Vector memory integration
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron (from Windsurf-Next) |
| Frontend | React 18 + Vite |
| Editor | Monaco Editor |
| Styling | Tailwind CSS + Framer Motion |
| AI Integration | HeadySystems API + multi-model |
| Language | TypeScript |
| Build | vsce (VS Code Extension bundler) |
| Package | electron-forge or electron-builder |

---

## Build Instructions

### Phase 1: Extension-Based Integration (Priority: CRITICAL)

Build Heady features as VS Code / Windsurf extensions first — this is the fastest path to value.

#### 1. Create the Heady Extension Package

```
extensions/heady-ide/
├── package.json              # Extension manifest
├── tsconfig.json
├── src/
│   ├── extension.ts          # Extension entry (activate/deactivate)
│   ├── HeadyBuddyPanel.ts   # AI chat sidebar webview
│   ├── CodeActions.ts         # Code actions (explain, test, fix, optimize)
│   ├── SacredGeometryTheme.ts # Theme registration
│   ├── LanguageSupport.ts     # HeadyScript + SGML languages
│   ├── PerformanceManager.ts  # Memory monitoring + cleanup
│   └── heady-integration.ts   # API client for heady-manager
├── media/
│   ├── buddy-icon.svg
│   └── sacred-geometry.css
└── language-configuration.json
```

#### 2. Extension Entry Point

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { HeadyBuddyPanel } from './HeadyBuddyPanel';
import { HeadyCodeActions } from './CodeActions';

export function activate(context: vscode.ExtensionContext) {
  // Register HeadyBuddy sidebar
  const buddyPanel = new HeadyBuddyPanel(context.extensionUri);
  
  // Register code actions
  const codeActions = new HeadyCodeActions();
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('heady.openChat', () => buddyPanel.show()),
    vscode.commands.registerCommand('heady.explainCode', () => codeActions.explain()),
    vscode.commands.registerCommand('heady.generateTests', () => codeActions.generateTests()),
    vscode.commands.registerCommand('heady.fixCode', () => codeActions.fix()),
    vscode.commands.registerCommand('heady.optimizeCode', () => codeActions.optimize()),
    vscode.commands.registerCommand('heady.startExperiment', startExperiment),
    vscode.commands.registerCommand('heady.showImpact', showImpactDashboard),
  );
  
  connectToHeadyManager();
}
```

#### 3. HeadyBuddy Sidebar (Webview Panel)

The sidebar is a webview panel with:
- Chat interface (user messages + AI responses with fade-in animations)
- Context-aware: reads active editor file, selection, language, workspace
- Connects to HeadySystems AI API
- Dark theme: `#0a0a0f` background, `#e0e0ff` text, `#7c3aed` accent
- Sacred Geometry breathing CSS animations

```typescript
// Key API integration in HeadyBuddyPanel.ts
const context = {
  message: userText,
  language: document?.languageId,
  selection: editor?.document.getText(editor.selection),
  file: document?.uri.fsPath,
  workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
};

const response = await fetch('https://api.headysystems.com/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.HEADY_API_KEY}`
  },
  body: JSON.stringify(context)
});
```

#### 4. Code Actions (5 Commands)

| Command | Keybinding | Description |
|---------|-----------|-------------|
| `heady.explainCode` | `Ctrl+Shift+H` | Explain selected code |
| `heady.generateTests` | `Ctrl+Shift+T` | Generate tests for selection |
| `heady.fixCode` | `Ctrl+Shift+F` | Fix/debug selected code |
| `heady.optimizeCode` | `Ctrl+Shift+O` | Optimize selected code |
| `heady.openChat` | `Ctrl+Shift+B` | Toggle HeadyBuddy chat |

Each action: reads editor selection → sends to HeadySystems API → displays/applies result.

### Phase 2: Deep Service Integration

#### 1. Multi-Model Router

4 AI models with different specializations:

| Model | Role | Use Case |
|-------|------|----------|
| **Heady Brain** | Primary AI | General coding assistance |
| **Heady Conductor** | Orchestrator | Task orchestration, workflow management |
| **Heady Pattern** | Analyzer | Code pattern recognition, refactoring |
| **Heady Critique** | Reviewer | Code review, quality assessment |

```typescript
// Model selection in settings
const models = {
  'heady-brain': { endpoint: '/ai/chat', name: 'Heady Brain' },
  'heady-conductor': { endpoint: '/ai/orchestrate', name: 'Heady Conductor' },
  'heady-pattern': { endpoint: '/ai/patterns', name: 'Heady Pattern' },
  'heady-critique': { endpoint: '/ai/review', name: 'Heady Critique' },
};
```

#### 2. Connect to Heady Manager

```
HEADY_API_URL=https://heady-manager-609590223909.us-central1.run.app
```

**Endpoints to wire:**
- `/api/ai/chat` — Primary AI chat
- `/api/ai/explain` — Code explanation
- `/api/ai/tests` — Test generation
- `/api/ai/fix` — Code fixing
- `/api/ai/optimize` — Code optimization
- `/api/ai/review` — Code review (Critique model)
- `/api/vector/search` — Semantic code search
- `/api/agents/status` — Multi-agent orchestration panel
- `/health` — System health for status bar

#### 3. Arena Mode

Multi-model comparison: send same prompt to 2+ models, display side-by-side responses, let user pick best. See `docs/ARENA_MODE_SPEC.md`.

### Phase 3: Sacred Geometry Theme

#### Color Palette

```json
{
  "editor.background": "#0a0a0f",
  "editor.foreground": "#e0e0ff",
  "editor.lineHighlightBackground": "#1a1a2e",
  "editor.selectionBackground": "#16213e",
  "editorCursor.foreground": "#7c3aed",
  "activityBar.background": "#0f0f1e",
  "sideBar.background": "#1a1a2e",
  "titleBar.activeBackground": "#16213e",
  "statusBar.background": "#1e1e3e"
}
```

#### Token Colors

| Scope | Color | Name |
|-------|-------|------|
| `keyword`, `storage.type` | `#7c3aed` | Heady Purple |
| `string`, `support.constant` | `#3b82f6` | Heady Blue |
| `entity.name.function` | `#10b981` | Heady Green |

#### Breathing Animations

```css
.heady-breathing {
  animation: breathe 4s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.05); opacity: 1; }
}
:root {
  --phi: 1.618;
  --golden-ratio: calc(1rem * var(--phi));
  --primary-hue: 280;
}
```

Sacred Geometry patterns: Flower of Life + Metatron's Cube as animated SVG backgrounds.

### Phase 4: Branding & Identity

1. Update `product.json`:
   ```json
   {
     "nameShort": "HeadyAI-IDE",
     "nameLong": "HeadyAI IDE",
     "applicationName": "headyai-ide",
     "dataFolderName": ".headyai-ide"
   }
   ```
2. Replace icons and splash screens with Heady branding
3. Custom welcome tab with Sacred Geometry patterns
4. Status bar: show connected Heady model + health status

### Phase 5: Custom Languages

Register two custom languages:
- **HeadyScript** (`.hs`) — DSL with keywords: `sacred`, `geometry`, `breathing`, `phi`, `golden`, `ratio`, `create`, `transform`, `evolve`, `manifest`
- **Sacred Geometry Markup** (`.sgml`) — Markup for geometry definitions

### Phase 6: Build & Package

#### Extension Manifest (`package.json`)

```json
{
  "name": "headyai-ide",
  "version": "1.0.0",
  "description": "HeadyAI-IDE - AI-powered development environment",
  "main": "out/main.js",
  "engines": { "vscode": "^1.85.0" },
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js",
    "package": "vsce package",
    "build": "npm run compile && npm run package",
    "dev": "npm run watch"
  },
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [
      { "command": "heady.openChat", "title": "HeadyBuddy: Open Chat" },
      { "command": "heady.explainCode", "title": "Heady: Explain Code" },
      { "command": "heady.generateTests", "title": "Heady: Generate Tests" },
      { "command": "heady.fixCode", "title": "Heady: Fix Code" },
      { "command": "heady.optimizeCode", "title": "Heady: Optimize Code" }
    ],
    "keybindings": [
      { "command": "heady.openChat", "key": "ctrl+shift+b" },
      { "command": "heady.explainCode", "key": "ctrl+shift+h" },
      { "command": "heady.generateTests", "key": "ctrl+shift+t" }
    ],
    "configuration": {
      "title": "HeadyAI-IDE",
      "properties": {
        "heady.ai.apiKey": { "type": "string" },
        "heady.ai.model": { "type": "string", "default": "heady-brain" },
        "heady.ui.breathingAnimations": { "type": "boolean", "default": true },
        "heady.sync.enabled": { "type": "boolean", "default": true }
      }
    }
  }
}
```

#### Desktop Packaging (Electron)

```bash
# Development
npm run dev              # Start with hot reload

# Production build
npm run build            # Compile TypeScript + package extension

# Electron desktop app
npm run build:electron   # Package with electron-forge
```

---

## Settings Reference

```json
{
  "heady.ai.apiKey": "<HEADY_API_KEY>",
  "heady.ai.model": "heady-brain",
  "heady.ai.contextWindow": 100000,
  "heady.ai.temperature": 0.7,
  "heady.ui.theme": "sacred-geometry",
  "heady.ui.breathingAnimations": true,
  "heady.code.autoComplete": true,
  "heady.code.explainOnHover": true,
  "heady.code.generateTests": true,
  "heady.code.optimizeOnSave": false,
  "heady.sync.enabled": true,
  "heady.sync.server": "wss://headysystems.com/sync"
}
```

## Environment Variables

```env
NODE_ENV=production
HEADY_API_KEY=<from .env>
HEADY_API_URL=https://heady-manager-609590223909.us-central1.run.app
OPENAI_API_KEY=<optional, for arena mode>
ANTHROPIC_API_KEY=<optional, for arena mode>
```

## Key Constraints

1. **Windsurf-Next base** — do not rewrite the VS Code core; layer on top via extensions
2. **Extension-first** — all Heady features as VS Code extensions (fastest path)
3. **TypeScript** — all extension code in TypeScript
4. **vsce** — package extensions with `vsce package`
5. **Sacred Geometry** — zero magic numbers, all dimensions from φ (1.618)
6. **4 AI models** — Brain (general), Conductor (orchestration), Pattern (analysis), Critique (review)
7. **Context-aware** — every AI call includes: active file, selection, language, workspace
8. **Performance** — monitor memory, threshold at 80%, auto-cleanup
9. **Cross-platform** — Windows (primary), macOS, Linux

## Verification

After building, verify:
1. Extension loads without errors (`Developer: Show Running Extensions`)
2. HeadyBuddy sidebar opens with `Ctrl+Shift+B`
3. All 5 code actions work on selected code
4. Sacred Geometry theme applies correctly
5. API calls to HeadySystems work with valid API key
6. Memory stays under 100MB overhead
7. `npm run build` produces valid `.vsix` package

---

*This prompt synthesizes: HeadyAI-IDE-Fusion-Plan.md, HeadyAI-IDE/README.md, HEADYAI_IDE_GUIDE.md (1200 lines), HEADY_AUTO_IDE.md, ARENA_MODE_SPEC.md, PRODUCT_SURFACES.md, and the monorepo codebase structure.*
