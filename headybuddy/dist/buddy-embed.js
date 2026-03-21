/**
 * HeadyBuddy Embeddable Chat Widget v1.0.0
 * Drop this <script> into any page to get the buddy chat overlay.
 * Usage: <script src="buddy-embed.js" data-api="http://localhost:3000"></script>
 */
(function () {
  'use strict';
  if (window.__HEADY_BUDDY_LOADED) return;
  window.__HEADY_BUDDY_LOADED = true;

  const API = document.currentScript?.getAttribute('data-api') || '';
  const PHI = 1.618;

  // ── Styles ──
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    #hb-root * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }
    #hb-pill {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      box-shadow: 0 4px 20px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0.3);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      animation: hb-pulse 3s infinite;
    }
    #hb-pill:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(79,70,229,0.5); }
    @keyframes hb-pulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(79,70,229,0.4), 0 0 0 0 rgba(79,70,229,0.3); }
      50% { box-shadow: 0 4px 20px rgba(79,70,229,0.4), 0 0 0 8px rgba(79,70,229,0); }
    }
    #hb-pill svg { width: 28px; height: 28px; fill: white; }
    #hb-panel {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 380px; height: 520px; border-radius: 20px;
      background: #0f0f18; border: 1px solid #252540;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,70,229,0.15);
      display: none; flex-direction: column; overflow: hidden;
      backdrop-filter: blur(20px);
      animation: hb-slideUp 0.3s ease-out;
    }
    @keyframes hb-slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    #hb-panel.open { display: flex; }
    .hb-header {
      padding: 16px 20px; display: flex; align-items: center; gap: 12px;
      background: linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.1));
      border-bottom: 1px solid #252540;
    }
    .hb-header-avatar {
      width: 36px; height: 36px; border-radius: 12px;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      display: flex; align-items: center; justify-content: center;
    }
    .hb-header-avatar svg { width: 20px; height: 20px; fill: white; }
    .hb-header-info { flex: 1; }
    .hb-header-title { font-size: 14px; font-weight: 700; color: #e8e8f0; }
    .hb-header-status { font-size: 11px; color: #22c55e; display: flex; align-items: center; gap: 4px; }
    .hb-header-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
    .hb-close { background: none; border: none; color: #7878a0; cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.2s; }
    .hb-close:hover { background: rgba(255,255,255,0.05); color: #e8e8f0; }
    .hb-close svg { width: 18px; height: 18px; }
    .hb-messages {
      flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px;
      scrollbar-width: thin; scrollbar-color: #252540 transparent;
    }
    .hb-msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.5; color: #e8e8f0; animation: hb-fadeIn 0.3s; }
    @keyframes hb-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .hb-msg.ai { align-self: flex-start; background: #161625; border: 1px solid #252540; border-bottom-left-radius: 4px; }
    .hb-msg.user { align-self: flex-end; background: linear-gradient(135deg, #4F46E5, #6366F1); border-bottom-right-radius: 4px; }
    .hb-msg.error { border-color: rgba(239,68,68,0.3); color: #f87171; }
    .hb-typing { display: flex; gap: 4px; padding: 12px 16px; align-self: flex-start; }
    .hb-typing span { width: 6px; height: 6px; border-radius: 50%; background: #7878a0; animation: hb-bounce 1.4s infinite; }
    .hb-typing span:nth-child(2) { animation-delay: 0.2s; }
    .hb-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes hb-bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
    .hb-input-area {
      padding: 12px 16px; border-top: 1px solid #252540; display: flex; gap: 8px; align-items: flex-end;
      background: rgba(15,15,24,0.8);
    }
    .hb-input {
      flex: 1; background: #161625; border: 1px solid #252540; border-radius: 12px;
      padding: 10px 14px; color: #e8e8f0; font-size: 13px; resize: none;
      outline: none; min-height: 40px; max-height: 100px; font-family: inherit; transition: border-color 0.2s;
    }
    .hb-input:focus { border-color: #4F46E5; }
    .hb-input::placeholder { color: #7878a0; }
    .hb-send {
      width: 40px; height: 40px; border-radius: 12px; border: none;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; flex-shrink: 0;
    }
    .hb-send:hover:not(:disabled) { transform: scale(1.05); }
    .hb-send:disabled { opacity: 0.4; cursor: default; }
    .hb-send svg { width: 18px; height: 18px; }
    .hb-suggestions { display: flex; gap: 6px; flex-wrap: wrap; padding: 0 20px 12px; }
    .hb-chip {
      padding: 6px 12px; border-radius: 100px; font-size: 11px; font-weight: 500;
      background: rgba(79,70,229,0.1); border: 1px solid rgba(79,70,229,0.2);
      color: #a5b4fc; cursor: pointer; transition: all 0.2s;
    }
    .hb-chip:hover { background: rgba(79,70,229,0.2); border-color: rgba(79,70,229,0.4); }
  `;
  document.head.appendChild(style);

  // ── DOM ──
  const root = document.createElement('div');
  root.id = 'hb-root';
  root.innerHTML = `
    <div id="hb-pill">
      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
    </div>
    <div id="hb-panel">
      <div class="hb-header">
        <div class="hb-header-avatar"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
        <div class="hb-header-info">
          <div class="hb-header-title">HeadyBuddy</div>
          <div class="hb-header-status">Online</div>
        </div>
        <button class="hb-close" id="hb-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="hb-messages" id="hb-messages">
        <div class="hb-msg ai">Hey! I'm HeadyBuddy, your AI companion. How can I help you today? 🤖</div>
      </div>
      <div class="hb-suggestions" id="hb-suggestions">
        <span class="hb-chip" data-q="System status">System status</span>
        <span class="hb-chip" data-q="Show services">Show services</span>
        <span class="hb-chip" data-q="What can you do?">What can you do?</span>
      </div>
      <div class="hb-input-area">
        <textarea class="hb-input" id="hb-input" placeholder="Ask HeadyBuddy anything..." rows="1"></textarea>
        <button class="hb-send" id="hb-send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // ── State ──
  const pill = document.getElementById('hb-pill');
  const panel = document.getElementById('hb-panel');
  const closeBtn = document.getElementById('hb-close');
  const messagesEl = document.getElementById('hb-messages');
  const inputEl = document.getElementById('hb-input');
  const sendBtn = document.getElementById('hb-send');
  const suggestionsEl = document.getElementById('hb-suggestions');
  let isOpen = false;
  let isLoading = false;
  const history = [];

  // ── Toggle ──
  pill.addEventListener('click', () => { isOpen = true; pill.style.display = 'none'; panel.classList.add('open'); inputEl.focus(); });
  closeBtn.addEventListener('click', () => { isOpen = false; panel.classList.remove('open'); pill.style.display = 'flex'; });

  // ── Chips ──
  suggestionsEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.hb-chip');
    if (chip) sendMessage(chip.dataset.q);
  });

  // ── Input ──
  inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputEl.value); } });
  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
  inputEl.addEventListener('input', () => { inputEl.style.height = 'auto'; inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px'; });

  function addMessage(role, text, isError) {
    const div = document.createElement('div');
    div.className = 'hb-msg ' + role + (isError ? ' error' : '');
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'hb-typing';
    div.id = 'hb-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() { const el = document.getElementById('hb-typing'); if (el) el.remove(); }

  async function sendMessage(text) {
    text = (text || '').trim();
    if (!text || isLoading) return;
    inputEl.value = '';
    inputEl.style.height = 'auto';
    suggestionsEl.style.display = 'none';

    addMessage('user', text);
    history.push({ role: 'user', content: text });
    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch((API || '') + '/api/buddy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-10) }),
      });
      hideTyping();
      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();
      const reply = data.reply || data.message || "I'm here to help!";
      addMessage('ai', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      hideTyping();
      addMessage('ai', 'Connection issue — I\u2019ll keep trying. (' + err.message + ')', true);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
    }
  }
})();
