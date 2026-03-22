/**
 * HeadyAI-IDE — VS Code Extension Entry Point
 *
 * Registers HeadyBuddy sidebar, 6 code action commands,
 * Sacred Geometry theme, and connects to Heady Manager API.
 *
 * © 2026 HeadySystems Inc. All Rights Reserved.
 */
import * as vscode from 'vscode';
import { HeadyBuddyViewProvider } from './HeadyBuddyViewProvider';

// ── φ-Math Constants ──────────────────────────────────────────────────────────
const PHI = 1.618033988749895;
const FIB = [1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getConfig(key: string): string {
  return vscode.workspace.getConfiguration('heady.ai').get(key, '');
}

function getApiUrl(): string {
  return getConfig('apiUrl') || 'https://heady-manager-609590223909.us-central1.run.app';
}

function getApiKey(): string {
  return getConfig('apiKey');
}

async function callHeadyAPI(endpoint: string, body: object): Promise<any> {
  const url = `${getApiUrl()}${endpoint}`;
  const apiKey = getApiKey();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(Math.round(Math.pow(PHI, 4) * 1000)), // φ⁴ ≈ 6.85s
    });
    if (!res.ok) { throw new Error(`API ${res.status}: ${res.statusText}`); }
    return await res.json();
  } catch (err: any) {
    vscode.window.showErrorMessage(`Heady API: ${err.message}`);
    return null;
  }
}

// ── Code Action Helpers ───────────────────────────────────────────────────────

async function getSelectedCode(): Promise<{ code: string; language: string; file: string } | null> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor — select some code first');
    return null;
  }
  const selection = editor.selection;
  const code = editor.document.getText(selection.isEmpty ? undefined : selection);
  if (!code.trim()) {
    vscode.window.showErrorMessage('No code selected');
    return null;
  }
  return {
    code,
    language: editor.document.languageId,
    file: editor.document.uri.fsPath,
  };
}

function showResultPanel(title: string, content: string) {
  const panel = vscode.window.createWebviewPanel(
    'headyResult',
    title,
    vscode.ViewColumn.Beside,
    { enableScripts: false }
  );

  panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      padding: 24px;
      background: #0a0a0f;
      color: #e0e0ff;
      line-height: 1.6;
    }
    h2 { color: #7c3aed; margin-bottom: 16px; }
    pre {
      background: #1a1a2e;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid #2a2a3e;
    }
    code { color: #10b981; }
    .heady-badge {
      display: inline-block;
      padding: 4px 12px;
      background: linear-gradient(135deg, #7c3aed, #3b82f6);
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="heady-badge">HeadyAI-IDE</div>
  <h2>${title}</h2>
  <pre><code>${escapeHtml(content)}</code></pre>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Code Actions ──────────────────────────────────────────────────────────────

async function explainCode() {
  const ctx = await getSelectedCode();
  if (!ctx) { return; }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Heady: Explaining code...' },
    async () => {
      const result = await callHeadyAPI('/api/ai/explain', { code: ctx.code, language: ctx.language });
      const explanation = result?.explanation || result?.content || result?.reply || 'No explanation returned';
      showResultPanel('Code Explanation', explanation);
    }
  );
}

async function generateTests() {
  const ctx = await getSelectedCode();
  if (!ctx) { return; }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Heady: Generating tests...' },
    async () => {
      const result = await callHeadyAPI('/api/ai/tests', { code: ctx.code, language: ctx.language });
      const tests = result?.tests || result?.content || result?.reply || '// No tests generated';

      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const position = editor.selection.end;
        editor.edit(editBuilder => {
          editBuilder.insert(position, `\n\n${tests}`);
        });
      }
    }
  );
}

async function fixCode() {
  const ctx = await getSelectedCode();
  if (!ctx) { return; }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Heady: Fixing code...' },
    async () => {
      const result = await callHeadyAPI('/api/ai/fix', { code: ctx.code, language: ctx.language });
      const fixed = result?.fixed || result?.content || result?.reply;
      if (fixed) {
        const editor = vscode.window.activeTextEditor!;
        editor.edit(editBuilder => {
          editBuilder.replace(editor.selection, fixed);
        });
      }
    }
  );
}

async function optimizeCode() {
  const ctx = await getSelectedCode();
  if (!ctx) { return; }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Heady: Optimizing code...' },
    async () => {
      const result = await callHeadyAPI('/api/ai/optimize', { code: ctx.code, language: ctx.language });
      const optimized = result?.optimized || result?.content || result?.reply;
      if (optimized) {
        const editor = vscode.window.activeTextEditor!;
        editor.edit(editBuilder => {
          editBuilder.replace(editor.selection, optimized);
        });
      }
    }
  );
}

async function reviewCode() {
  const ctx = await getSelectedCode();
  if (!ctx) { return; }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Heady: Reviewing code...' },
    async () => {
      const result = await callHeadyAPI('/api/ai/review', { code: ctx.code, language: ctx.language });
      const review = result?.review || result?.content || result?.reply || 'No review returned';
      showResultPanel('Code Review', review);
    }
  );
}

// ── Activate ──────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  console.log('[HeadyAI-IDE] Activating extension...');

  // Register HeadyBuddy sidebar
  const buddyProvider = new HeadyBuddyViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('heady.buddyChat', buddyProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('heady.openChat', () => {
      vscode.commands.executeCommand('workbench.view.extension.heady-sidebar');
    }),
    vscode.commands.registerCommand('heady.explainCode', explainCode),
    vscode.commands.registerCommand('heady.generateTests', generateTests),
    vscode.commands.registerCommand('heady.fixCode', fixCode),
    vscode.commands.registerCommand('heady.optimizeCode', optimizeCode),
    vscode.commands.registerCommand('heady.reviewCode', reviewCode),
  );

  // Status bar
  const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusItem.text = '$(sparkle) HeadyAI';
  statusItem.tooltip = 'HeadyAI-IDE — Click to open HeadyBuddy';
  statusItem.command = 'heady.openChat';
  statusItem.show();
  context.subscriptions.push(statusItem);

  console.log('[HeadyAI-IDE] ✓ Extension activated with 6 commands + sidebar');
}

export function deactivate() {
  console.log('[HeadyAI-IDE] Extension deactivated');
}
