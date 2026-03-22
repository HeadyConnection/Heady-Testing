/**
 * HeadyBuddy Sidebar — Webview View Provider
 *
 * Renders an AI chat panel in the VS Code sidebar with:
 * - Sacred Geometry dark theme
 * - Context-aware messages (file, selection, language)
 * - Model selector (Brain, Conductor, Pattern, Critique)
 * - φ-timed breathing animations
 *
 * © 2026 HeadySystems Inc.
 */
import * as vscode from 'vscode';

export class HeadyBuddyViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'heady.buddyChat';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtml();
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'chat':
          await this._handleChat(message.text, message.model);
          break;
        case 'getContext':
          this._sendEditorContext();
          break;
      }
    });
  }

  private async _handleChat(text: string, model: string = 'heady-brain') {
    const apiUrl = vscode.workspace.getConfiguration('heady.ai').get('apiUrl', 'https://heady-manager-609590223909.us-central1.run.app');
    const apiKey = vscode.workspace.getConfiguration('heady.ai').get('apiKey', '');

    // Get editor context
    const editor = vscode.window.activeTextEditor;
    const context = {
      message: text,
      model,
      language: editor?.document.languageId,
      file: editor?.document.uri.fsPath,
      selection: editor?.selection ? editor.document.getText(editor.selection) : undefined,
      workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    };

    try {
      const res = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          model,
          systemPrompt: 'You are HeadyBuddy, a helpful AI companion by HeadySystems. Be concise, friendly, and proactive.',
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.reply || data.content || data.message || 'I received your message.';
        this._view?.webview.postMessage({ command: 'response', text: reply, model });
      } else {
        this._view?.webview.postMessage({ command: 'response', text: `API error: ${res.status}`, model });
      }
    } catch (err: any) {
      this._view?.webview.postMessage({ command: 'response', text: `Connection error: ${err.message}`, model });
    }
  }

  private _sendEditorContext() {
    const editor = vscode.window.activeTextEditor;
    this._view?.webview.postMessage({
      command: 'context',
      language: editor?.document.languageId || 'none',
      file: editor?.document.fileName || 'none',
      hasSelection: editor ? !editor.selection.isEmpty : false,
    });
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HeadyBuddy</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
    color: #e0e0ff;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Header */
  .header {
    padding: 12px 16px;
    background: rgba(124, 58, 237, 0.1);
    border-bottom: 1px solid rgba(124, 58, 237, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .header .logo {
    width: 24px; height: 24px;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    animation: breathe 4s ease-in-out infinite;
  }
  .header h3 { font-size: 13px; font-weight: 600; flex: 1; }
  .header .context-badge {
    font-size: 10px;
    padding: 2px 8px;
    background: rgba(59,130,246,0.2);
    border-radius: 8px;
    color: #93c5fd;
  }

  /* Model selector */
  .model-bar {
    padding: 8px 16px;
    display: flex;
    gap: 4px;
    overflow-x: auto;
  }
  .model-btn {
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid rgba(124,58,237,0.3);
    background: transparent;
    color: #a0a0cc;
    font-size: 11px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .model-btn.active {
    background: rgba(124,58,237,0.3);
    color: #e0e0ff;
    border-color: #7c3aed;
  }
  .model-btn:hover { border-color: #7c3aed; color: #e0e0ff; }

  /* Messages */
  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .msg {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.5;
    animation: fadeIn 0.3s ease-out;
    max-width: 90%;
    word-wrap: break-word;
  }
  .msg.user {
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }
  .msg.buddy {
    background: rgba(30, 30, 62, 0.8);
    border: 1px solid rgba(124, 58, 237, 0.15);
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }
  .msg.buddy .model-tag {
    font-size: 10px;
    color: #7c3aed;
    margin-bottom: 4px;
    font-weight: 600;
  }

  /* Input */
  .input-area {
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(124, 58, 237, 0.15);
    display: flex;
    gap: 8px;
  }
  .input-area input {
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(124, 58, 237, 0.3);
    background: rgba(10, 10, 15, 0.8);
    color: #e0e0ff;
    font-size: 13px;
    outline: none;
    transition: border-color 0.233s;
  }
  .input-area input:focus { border-color: #7c3aed; }
  .input-area button {
    padding: 8px 16px;
    border-radius: 8px;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.233s;
  }
  .input-area button:hover { opacity: 0.9; }
  .input-area button:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Typing indicator */
  .typing { display: none; padding: 0 16px; }
  .typing.active { display: flex; gap: 4px; align-items: center; }
  .typing span {
    width: 6px; height: 6px;
    background: #7c3aed;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;
  }
  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.05); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">✦</div>
    <h3>HeadyBuddy</h3>
    <span class="context-badge" id="contextBadge">—</span>
  </div>

  <div class="model-bar">
    <button class="model-btn active" data-model="heady-brain">🧠 Brain</button>
    <button class="model-btn" data-model="heady-conductor">🎭 Conductor</button>
    <button class="model-btn" data-model="heady-pattern">🔍 Pattern</button>
    <button class="model-btn" data-model="heady-critique">📝 Critique</button>
  </div>

  <div class="messages" id="messages">
    <div class="msg buddy">
      <div class="model-tag">🧠 Heady Brain</div>
      Hey! I'm HeadyBuddy. I can explain, fix, optimize, or review your code. How can I help?
    </div>
  </div>

  <div class="typing" id="typing"><span></span><span></span><span></span></div>

  <div class="input-area">
    <input type="text" id="input" placeholder="Ask HeadyBuddy anything..." autocomplete="off" />
    <button id="sendBtn">Send</button>
  </div>

<script>
  const vscode = acquireVsCodeApi();
  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('input');
  const sendBtn = document.getElementById('sendBtn');
  const typingEl = document.getElementById('typing');
  const contextBadge = document.getElementById('contextBadge');

  let activeModel = 'heady-brain';
  const modelLabels = {
    'heady-brain': '🧠 Brain',
    'heady-conductor': '🎭 Conductor',
    'heady-pattern': '🔍 Pattern',
    'heady-critique': '📝 Critique',
  };

  // Model buttons
  document.querySelectorAll('.model-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeModel = btn.dataset.model;
    });
  });

  function addMessage(text, isUser, model) {
    const div = document.createElement('div');
    div.className = 'msg ' + (isUser ? 'user' : 'buddy');
    if (!isUser && model) {
      div.innerHTML = '<div class="model-tag">' + (modelLabels[model] || model) + '</div>' + text;
    } else {
      div.textContent = text;
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    addMessage(text, true);
    inputEl.value = '';
    sendBtn.disabled = true;
    typingEl.classList.add('active');
    vscode.postMessage({ command: 'chat', text, model: activeModel });
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  // Receive messages from extension
  window.addEventListener('message', event => {
    const msg = event.data;
    switch (msg.command) {
      case 'response':
        typingEl.classList.remove('active');
        sendBtn.disabled = false;
        addMessage(msg.text, false, msg.model);
        break;
      case 'context':
        contextBadge.textContent = msg.language || '—';
        break;
    }
  });

  // Request context on load
  vscode.postMessage({ command: 'getContext' });
</script>
</body>
</html>`;
  }
}
