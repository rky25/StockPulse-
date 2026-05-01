const fs = require('fs');

let content = fs.readFileSync('app.js', 'utf8');

const chatbotJS = `

// ═══════════════════════════════════════════════════════
// STOCKPULSE AI CHATBOT — Production Module
// ═══════════════════════════════════════════════════════
let chatOpen = false;
let chatNewsCache = {};

function toggleChatbot() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chatPanel');
  const fab = document.getElementById('chatFab');
  if (chatOpen) {
    panel.classList.add('open');
    fab.classList.add('open');
    document.getElementById('chatInput')?.focus();
    // Update subtitle with current stock
    const sub = document.getElementById('chatSubtitle');
    if (sub) sub.textContent = currentSymbol ? 'Analyzing ' + currentSymbol.replace('.NS','') : 'Llama 3.1 70B \\u00B7 Ready';
    // Pre-fetch news for current stock
    if (currentSymbol) fetchStockNews(currentSymbol);
  } else {
    panel.classList.remove('open');
    fab.classList.remove('open');
  }
}

function clearChat() {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  box.innerHTML = \`
    <div class="chat-welcome">
      <div class="chat-welcome-icon">\\u2728</div>
      <div class="chat-welcome-title">Chat cleared!</div>
      <div class="chat-welcome-desc">Ask me anything about \${currentSymbol ? currentSymbol.replace('.NS','') : 'your stock'}.</div>
    </div>
  \`;
}

async function fetchStockNews(symbol) {
  if (chatNewsCache[symbol] && Date.now() - chatNewsCache[symbol].ts < 120000) return chatNewsCache[symbol].data;
  try {
    const r = await fetch('http://localhost:8080/api/news/' + encodeURIComponent(symbol));
    if (!r.ok) throw new Error('News fetch failed');
    const data = await r.json();
    chatNewsCache[symbol] = { data: data.articles || [], ts: Date.now() };
    return chatNewsCache[symbol].data;
  } catch(e) {
    console.error('News fetch error:', e);
    return [];
  }
}

function buildChatContext() {
  const ctx = {
    symbol: currentSymbol || 'None selected',
    price: lastPrice || '--',
    change: '--',
    dayHigh: '--',
    dayLow: '--',
    prevClose: '--',
    volume: '--',
    signal: 'No signal',
    confidence: '--',
    vwap: '--',
    rsi: '--',
    supertrend: '--',
    adx: '--',
    atr: '--',
    setup: 'None',
    regime: niftyRegime ? niftyRegime.regime : 'Unknown',
    vix: vixValue ? vixValue.toFixed(1) : '--',
    sectorTrend: '--',
    entry: '--',
    sl: '--',
    t1: '--',
    t2: '--',
    rr: '--',
    orbHigh: orbData ? orbData.high : '--',
    orbLow: orbData ? orbData.low : '--',
    news: 'No recent news.'
  };

  // Fill from rawData
  if (rawData && rawData.meta) {
    const m = rawData.meta;
    ctx.prevClose = m.chartPreviousClose || m.previousClose || '--';
    ctx.dayHigh = m.regularMarketDayHigh || '--';
    ctx.dayLow = m.regularMarketDayLow || '--';
    ctx.volume = m.regularMarketVolume ? m.regularMarketVolume.toLocaleString('en-IN') : '--';
    const chg = lastPrice - (ctx.prevClose || lastPrice);
    const pct = ctx.prevClose ? ((chg / ctx.prevClose) * 100).toFixed(2) : '0';
    ctx.change = (chg >= 0 ? '+' : '') + chg.toFixed(2) + ' (' + (chg >= 0 ? '+' : '') + pct + '%)';
  }

  // Fill from analysisResult
  if (analysisResult) {
    ctx.signal = analysisResult.overall || 'No signal';
    ctx.confidence = analysisResult.confidence || '--';
    ctx.vwap = analysisResult.vwap ? analysisResult.vwap.toFixed(2) : '--';
    ctx.rsi = analysisResult.rsi ? analysisResult.rsi.toFixed(1) : '--';
    ctx.supertrend = analysisResult.supertrend || '--';
    ctx.adx = analysisResult.adx ? analysisResult.adx.toFixed(1) : '--';
    ctx.atr = analysisResult.atr ? analysisResult.atr.toFixed(2) : '--';
    ctx.setup = analysisResult.setup ? analysisResult.setup.name : 'None';
  }

  // Fill from calcResult
  if (calcResult) {
    ctx.entry = calcResult.entry ? calcResult.entry.toFixed(2) : '--';
    ctx.sl = calcResult.sl ? calcResult.sl.toFixed(2) : '--';
    ctx.t1 = calcResult.target1 ? calcResult.target1.toFixed(2) : '--';
    ctx.t2 = calcResult.target2 ? calcResult.target2.toFixed(2) : '--';
    if (calcResult.risk && calcResult.target1 && calcResult.entry) {
      const reward = Math.abs(calcResult.target1 - calcResult.entry);
      ctx.rr = '1:' + (reward / calcResult.risk).toFixed(1);
    }
  }

  // Fill ORB
  if (orbData && orbData.high) {
    ctx.orbHigh = orbData.high.toFixed(2);
    ctx.orbLow = orbData.low.toFixed(2);
  }

  // Fill news from cache
  if (chatNewsCache[currentSymbol] && chatNewsCache[currentSymbol].data.length) {
    ctx.news = chatNewsCache[currentSymbol].data
      .slice(0, 5)
      .map((a, i) => (i+1) + '. ' + a.title + (a.publisher ? ' (' + a.publisher + ')' : ''))
      .join('\\n');
  }

  return ctx;
}

function addMessageBubble(role, text) {
  const box = document.getElementById('chatMessages');
  if (!box) return;

  // Remove welcome if present
  const welcome = box.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + role;
  
  // Format AI responses: bold, italic etc.
  if (role === 'ai') {
    text = text
      .replace(/\\*\\*\\[?(BUY|SELL|HOLD)\\]?\\*\\*/gi, '<strong>[$1]</strong>')
      .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
      .replace(/\\n/g, '<br>');
    bubble.innerHTML = text;
  } else {
    bubble.textContent = text;
  }

  // Add timestamp
  const timeEl = document.createElement('div');
  timeEl.className = 'chat-bubble-time';
  timeEl.textContent = new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  bubble.appendChild(timeEl);

  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
}

function addTypingIndicator() {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  const existing = box.querySelector('.chat-typing');
  if (existing) existing.remove();
  
  const el = document.createElement('div');
  el.className = 'chat-typing';
  el.innerHTML = '<div class="chat-typing-dot"></div><div class="chat-typing-dot"></div><div class="chat-typing-dot"></div>';
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator() {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  const el = box.querySelector('.chat-typing');
  if (el) el.remove();
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const btn = document.getElementById('chatSendBtn');
  if (!input) return;

  const question = input.value.trim();
  if (!question) return;

  // Check if stock is loaded
  if (!currentSymbol) {
    addMessageBubble('error', 'Please select a stock first by clicking a chip or searching above.');
    return;
  }

  // Disable input
  input.value = '';
  input.disabled = true;
  btn.disabled = true;

  // Show user message
  addMessageBubble('user', question);

  // Show typing
  addTypingIndicator();

  // Pre-fetch news silently
  await fetchStockNews(currentSymbol);

  // Build context
  const context = buildChatContext();

  try {
    const r = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context })
    });

    removeTypingIndicator();

    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      addMessageBubble('error', 'AI Error: ' + (errData.error || 'Service unavailable'));
    } else {
      const data = await r.json();
      addMessageBubble('ai', data.reply || 'No response received.');
    }
  } catch (e) {
    removeTypingIndicator();
    addMessageBubble('error', 'Network error: Could not reach AI service. Is the server running?');
  }

  // Re-enable input
  input.disabled = false;
  btn.disabled = false;
  input.focus();
}

function sendQuickQuestion(q) {
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = q;
    sendChatMessage();
  }
}
`;

// Append to end of app.js
content += chatbotJS;
fs.writeFileSync('app.js', content, 'utf8');
console.log('Chatbot JS appended to app.js');
