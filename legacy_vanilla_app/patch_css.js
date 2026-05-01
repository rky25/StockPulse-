const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

const chatCSS = `
/* ═══════════════════════════════════════════
   AI CHATBOT WIDGET — StockPulse v5 Pro
   ═══════════════════════════════════════════ */

/* === FLOATING ACTION BUTTON === */
.chat-fab{
  position:fixed;bottom:24px;right:24px;width:56px;height:56px;
  border-radius:50%;cursor:pointer;z-index:9998;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg, #5367ff 0%, #7b8cff 100%);
  box-shadow:0 4px 20px rgba(83,103,255,.35), 0 0 0 0 rgba(83,103,255,.3);
  transition:all .3s cubic-bezier(.4,0,.2,1);
  animation:fabPulse 3s ease-in-out infinite;
}
.chat-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(83,103,255,.45)}
.chat-fab:active{transform:scale(.95)}
.chat-fab svg{width:26px;height:26px;color:#fff;transition:transform .3s}
.chat-fab.open svg{transform:rotate(90deg)}
@keyframes fabPulse{0%,100%{box-shadow:0 4px 20px rgba(83,103,255,.35),0 0 0 0 rgba(83,103,255,.3)}50%{box-shadow:0 4px 20px rgba(83,103,255,.35),0 0 0 10px rgba(83,103,255,0)}}

.chat-fab-badge{
  position:absolute;top:-2px;right:-2px;
  background:var(--green);color:#fff;
  font-size:8px;font-weight:800;
  padding:2px 5px;border-radius:10px;
  letter-spacing:.5px;
  animation:badgeBounce .6s ease;
}
@keyframes badgeBounce{0%{transform:scale(0)}50%{transform:scale(1.3)}100%{transform:scale(1)}}

/* === CHAT PANEL === */
.chat-panel{
  position:fixed;bottom:92px;right:24px;
  width:400px;max-height:580px;
  background:var(--card);
  border:1px solid var(--border);
  border-radius:16px;
  box-shadow:0 12px 48px rgba(0,0,0,.15), 0 0 0 1px rgba(255,255,255,.05) inset;
  z-index:9999;
  display:none;
  flex-direction:column;
  overflow:hidden;
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  animation:panelSlideUp .3s cubic-bezier(.4,0,.2,1);
}
.chat-panel.open{display:flex}
@keyframes panelSlideUp{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}

[data-theme="dark"] .chat-panel{
  box-shadow:0 12px 48px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.06) inset;
  background:rgba(30,33,48,.95);
}

/* === CHAT HEADER === */
.chat-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 16px;
  background:linear-gradient(135deg, #5367ff 0%, #7b8cff 100%);
  color:#fff;
  border-bottom:1px solid rgba(255,255,255,.1);
}
.chat-header-left{display:flex;align-items:center;gap:10px}
.chat-avatar{
  width:36px;height:36px;border-radius:50%;
  background:rgba(255,255,255,.2);
  display:flex;align-items:center;justify-content:center;
  backdrop-filter:blur(8px);
}
.chat-avatar svg{width:20px;height:20px;color:#fff}
.chat-title{font-size:14px;font-weight:700;letter-spacing:-.2px}
.chat-subtitle{font-size:10px;opacity:.75;font-weight:500}
.chat-header-actions{display:flex;gap:6px}
.chat-clear-btn,.chat-close-btn{
  width:30px;height:30px;border:none;border-radius:8px;
  background:rgba(255,255,255,.15);cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:.2s;
}
.chat-clear-btn:hover,.chat-close-btn:hover{background:rgba(255,255,255,.25)}
.chat-clear-btn svg,.chat-close-btn svg{width:14px;height:14px;color:#fff}

/* === MESSAGES AREA === */
.chat-messages{
  flex:1;overflow-y:auto;padding:16px;
  display:flex;flex-direction:column;gap:12px;
  min-height:280px;max-height:340px;
  scroll-behavior:smooth;
}
.chat-messages::-webkit-scrollbar{width:4px}
.chat-messages::-webkit-scrollbar-track{background:transparent}
.chat-messages::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}

/* Welcome */
.chat-welcome{
  display:flex;flex-direction:column;align-items:center;
  text-align:center;padding:20px 10px;
}
.chat-welcome-icon{font-size:36px;margin-bottom:10px;animation:sparkle 2s ease-in-out infinite}
@keyframes sparkle{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.1) rotate(5deg)}}
.chat-welcome-title{font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px}
.chat-welcome-desc{font-size:12px;color:var(--text2);line-height:1.5;max-width:300px}

/* Bubbles */
.chat-bubble{
  max-width:88%;padding:12px 14px;
  border-radius:14px;font-size:13px;line-height:1.55;
  word-wrap:break-word;
  animation:bubbleIn .25s ease;
}
@keyframes bubbleIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

.chat-bubble.user{
  align-self:flex-end;
  background:linear-gradient(135deg, #5367ff, #7b8cff);
  color:#fff;
  border-bottom-right-radius:4px;
}
.chat-bubble.ai{
  align-self:flex-start;
  background:var(--bg);
  color:var(--text);
  border:1px solid var(--border2);
  border-bottom-left-radius:4px;
}
.chat-bubble.ai strong{color:var(--accent);font-weight:700}
.chat-bubble.ai em{color:var(--text2);font-style:italic}

.chat-bubble-time{
  font-size:9px;color:var(--text3);margin-top:4px;
  text-align:right;font-weight:500;
}
.chat-bubble.ai .chat-bubble-time{text-align:left}

/* Typing indicator */
.chat-typing{
  display:flex;align-items:center;gap:4px;
  padding:12px 14px;background:var(--bg);
  border:1px solid var(--border2);
  border-radius:14px;border-bottom-left-radius:4px;
  align-self:flex-start;
  max-width:80px;
}
.chat-typing-dot{
  width:7px;height:7px;border-radius:50%;
  background:var(--text3);
  animation:typingBounce 1.4s infinite ease-in-out;
}
.chat-typing-dot:nth-child(1){animation-delay:0s}
.chat-typing-dot:nth-child(2){animation-delay:.2s}
.chat-typing-dot:nth-child(3){animation-delay:.4s}
@keyframes typingBounce{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}

/* Error bubble */
.chat-bubble.error{
  background:var(--red-bg);border:1px solid var(--red);
  color:var(--red);font-size:12px;
  align-self:flex-start;
}

/* === QUICK ACTION CHIPS === */
.chat-quick-actions{
  display:flex;gap:6px;padding:8px 16px;
  overflow-x:auto;border-top:1px solid var(--border2);
  scrollbar-width:none;
}
.chat-quick-actions::-webkit-scrollbar{display:none}
.chat-chip{
  flex-shrink:0;height:30px;padding:0 12px;
  border-radius:15px;border:1px solid var(--border);
  background:var(--card);color:var(--text2);
  font-size:11px;font-weight:600;font-family:inherit;
  cursor:pointer;transition:all .2s;
  white-space:nowrap;
}
.chat-chip:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-bg)}
.chat-chip:active{transform:scale(.95)}

/* === INPUT BAR === */
.chat-input-bar{
  display:flex;align-items:center;gap:8px;
  padding:10px 12px;
  border-top:1px solid var(--border2);
  background:var(--card);
}
.chat-input-bar input{
  flex:1;height:38px;padding:0 14px;
  border-radius:20px;border:1px solid var(--border);
  background:var(--bg);color:var(--text);
  font-size:13px;font-family:inherit;outline:none;
  transition:border-color .2s;
}
.chat-input-bar input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-bg)}
.chat-input-bar input::placeholder{color:var(--text3)}

.chat-send-btn{
  width:38px;height:38px;border-radius:50%;border:none;
  background:linear-gradient(135deg, #5367ff, #7b8cff);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:all .2s;flex-shrink:0;
}
.chat-send-btn:hover{transform:scale(1.05);box-shadow:0 2px 12px rgba(83,103,255,.3)}
.chat-send-btn:active{transform:scale(.92)}
.chat-send-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}
.chat-send-btn svg{width:16px;height:16px;color:#fff;margin-left:2px}

/* === MOBILE RESPONSIVE === */
@media(max-width:640px){
  .chat-fab{bottom:16px;right:16px;width:50px;height:50px}
  .chat-fab svg{width:22px;height:22px}
  .chat-panel{
    bottom:0;right:0;left:0;
    width:100%;max-height:75vh;
    border-radius:16px 16px 0 0;
    animation:panelSlideUpMobile .3s cubic-bezier(.4,0,.2,1);
  }
  @keyframes panelSlideUpMobile{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .chat-messages{min-height:200px;max-height:50vh}
}
`;

css += '\n' + chatCSS;
fs.writeFileSync('styles.css', css, 'utf8');
console.log('Chatbot CSS appended to styles.css');
