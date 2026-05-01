const fs = require('fs');

// Patch server.js
let serverJs = fs.readFileSync('server.js', 'utf8');
serverJs = serverJs.replace(/\/\/ ===== AI CHAT ENDPOINT \(POST\) =====[\s\S]*?function buildSystemPrompt\(ctx\) {[\s\S]*?}\n/g, '');
fs.writeFileSync('server.js', serverJs);

// Patch index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/<!-- ===== AI CHATBOT WIDGET ===== -->[\s\S]*?<div class="chat-panel" id="chatPanel">[\s\S]*?<\/div>\n<\/div>\n/g, '');
fs.writeFileSync('index.html', indexHtml);

// Patch app.js
let appJs = fs.readFileSync('app.js', 'utf8');
appJs = appJs.replace(/\/\/ ═══════════════════════════════════════════════════════\n\/\/ STOCKPULSE AI CHATBOT[\s\S]*$/g, '');
fs.writeFileSync('app.js', appJs);

// Patch styles.css
let stylesCss = fs.readFileSync('styles.css', 'utf8');
stylesCss = stylesCss.replace(/\/\* ═══════════════════════════════════════════\n   AI CHATBOT WIDGET — StockPulse v5 Pro[\s\S]*$/g, '');
fs.writeFileSync('styles.css', stylesCss);

console.log('AI completely disabled and removed');
