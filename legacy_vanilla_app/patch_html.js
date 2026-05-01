const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const chatHTML = `
<!-- ===== AI CHATBOT WIDGET ===== -->
<div class="chat-fab" id="chatFab" onclick="toggleChatbot()" title="StockPulse AI Assistant">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <path d="M8 10h.01M12 10h.01M16 10h.01"/>
  </svg>
  <span class="chat-fab-badge" id="chatFabBadge" style="display:none">AI</span>
</div>

<div class="chat-panel" id="chatPanel">
  <div class="chat-header">
    <div class="chat-header-left">
      <div class="chat-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z"/><path d="M18 14c-1.5-1-3.7-2-6-2s-4.5 1-6 2"/><circle cx="12" cy="20" r="2"/></svg>
      </div>
      <div>
        <div class="chat-title">StockPulse AI</div>
        <div class="chat-subtitle" id="chatSubtitle">Llama 3.1 70B &middot; Ready</div>
      </div>
    </div>
    <div class="chat-header-actions">
      <button class="chat-clear-btn" onclick="clearChat()" title="Clear chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg>
      </button>
      <button class="chat-close-btn" onclick="toggleChatbot()" title="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  </div>

  <div class="chat-messages" id="chatMessages">
    <div class="chat-welcome">
      <div class="chat-welcome-icon">&#10024;</div>
      <div class="chat-welcome-title">Hi! I'm your AI Trading Assistant</div>
      <div class="chat-welcome-desc">Select a stock first, then ask me anything about it &mdash; I'll analyze the live technicals and latest news to give you actionable advice.</div>
    </div>
  </div>

  <div class="chat-quick-actions" id="chatQuickActions">
    <button class="chat-chip" onclick="sendQuickQuestion('Should I buy or sell this stock right now?')">Buy or Sell?</button>
    <button class="chat-chip" onclick="sendQuickQuestion('What is the current risk level and where should I set my stop loss?')">Risk &amp; SL?</button>
    <button class="chat-chip" onclick="sendQuickQuestion('Summarize the latest news and its impact on this stock.')">News Impact</button>
    <button class="chat-chip" onclick="sendQuickQuestion('Give me a complete analysis: entry, targets, and stop loss.')">Full Analysis</button>
  </div>

  <div class="chat-input-bar">
    <input type="text" id="chatInput" placeholder="Ask about this stock..." autocomplete="off" onkeydown="if(event.key==='Enter')sendChatMessage()">
    <button class="chat-send-btn" id="chatSendBtn" onclick="sendChatMessage()">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
    </button>
  </div>
</div>
`;

// Insert before the script tags
content = content.replace(/<script src="trading\.js"><\/script>/,
  chatHTML + '\n<script src="trading.js"></script>');

fs.writeFileSync('index.html', content, 'utf8');
console.log('Chatbot HTML injected into index.html');
