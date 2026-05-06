// Direct NVIDIA Llama 3.1 70B API — no backend dependency
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

function buildSystemPrompt(ctx) {
  // If we have real stock data, use the full trading advisor prompt
  if (ctx.symbol && ctx.symbol !== 'General' && ctx.price && ctx.price !== '--') {
    return `You are StockPulse AI — a professional, concise intraday trading advisor for Indian NSE stocks.

CRITICAL RULES — READ CAREFULLY:
1. The "Signal Engine Verdict" below is the PRIMARY source of truth. It is computed by a strict, multi-indicator confluence system that requires VWAP, RSI, Supertrend, ADX, Bollinger Bands, and market regime to all agree before issuing a BUY or SELL.
2. If the Signal Engine Verdict says "NEUTRAL" or "WAIT", you MUST also recommend HOLD/WAIT. Do NOT override it with your own BUY or SELL. Instead, explain WHY the engine is cautious.
3. If the Signal Engine Verdict says "STRONG BUY", "BUY", "SELL", or "STRONG SELL", you may agree and elaborate on the reasoning using the data below.
4. Always format your verdict like: **[BUY/SELL/HOLD]** — reason here.
5. Always mention the key risk (stop loss level, or the main danger).
6. Keep responses to 2-4 sentences. Traders need speed, not essays.
7. Use the live data provided below. Never guess prices or make up data.
8. If the market is closed or data is stale, say so.
9. When the engine says WAIT, suggest what conditions would need to change for a valid entry.
10. Mention news impact if relevant, but never let news alone override the quantitative signal.

═══ LIVE MARKET CONTEXT ═══
Stock: ${ctx.displaySymbol || ctx.symbol}
Current Price: ₹${ctx.price}
Day Change: ${ctx.change || '--'}
Day High: ₹${ctx.dayHigh || '--'}
Day Low: ₹${ctx.dayLow || '--'}
Previous Close: ₹${ctx.prevClose || '--'}
Volume: ${ctx.volume || '--'}
Volume Ratio: ${ctx.volRatio || '--'}x avg

═══ TECHNICAL ANALYSIS ═══
Signal Engine Verdict: ${ctx.signal || 'No signal'}
Confidence: ${ctx.confidence || '--'}%
Verdict Reason: ${ctx.verdictReason || 'N/A'}
Buy Votes: ${ctx.buyVotes ?? '--'} | Sell Votes: ${ctx.sellVotes ?? '--'}
VWAP: ₹${ctx.vwap || '--'}
RSI (14): ${ctx.rsi || '--'}
Supertrend: ₹${ctx.supertrend || '--'} (${ctx.supertrendDir || '--'})
ADX: ${ctx.adx || '--'}
ATR: ${ctx.atr || '--'}
Setup: ${ctx.setup || 'None detected'}
Setup Detail: ${ctx.setupDesc || ''}

═══ MARKET REGIME ═══
Regime: ${ctx.regime || 'Unknown'}
India VIX: ${ctx.vix || '--'}
NIFTY 50 Trend: ${ctx.niftyTrend || 'Unknown'}
15-Min Trend: ${ctx.trend15m || 'Unknown'}
Sector Trend: ${ctx.sectorTrend || 'Unknown'}

═══ ENTRY/EXIT LEVELS ═══
Suggested Entry: ₹${ctx.entry || '--'}
Stop Loss: ₹${ctx.sl || '--'}
Target 1: ₹${ctx.t1 || '--'}
Target 2: ₹${ctx.t2 || '--'}
Target 3: ₹${ctx.t3 || '--'}
Recommended Qty: ${ctx.qty || '--'}
Risk:Reward: ${ctx.rr || '--'}

═══ WARNINGS ═══
${ctx.warnings || 'None'}

═══ CURRENT TIME ═══
${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Market Hours: 9:15 AM – 3:30 PM IST (Mon-Fri)`;
  }

  // Fallback: general trading knowledge assistant
  return `You are StockPulse AI — a professional, concise trading knowledge assistant for Indian NSE stocks.

You help traders understand technical analysis concepts, indicators, chart patterns, and trading strategies.

RULES:
1. Keep responses concise (3-5 sentences max) unless the user asks for detail.
2. Use simple language that a beginner can understand.
3. Give practical examples when explaining concepts.
4. If the question is about a specific indicator (RSI, VWAP, MACD, etc.), explain what it measures, how to read it, and when it's useful.
5. Format key terms in **bold**.
6. Be friendly and encouraging.

Current Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Market Hours: 9:15 AM – 3:30 PM IST (Mon-Fri)`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { question, context } = body;

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Please enter a question' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = buildSystemPrompt(context || {});

    const payload = {
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.3,
      top_p: 0.8,
      max_tokens: 800,
      stream: false,
    };

    const res = await fetch(NVIDIA_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[NVIDIA API Error]', res.status, errText);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();

    if (data.choices && data.choices[0]) {
      return new Response(
        JSON.stringify({
          reply: data.choices[0].message.content,
          model: NVIDIA_MODEL,
          tokens: data.usage,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'AI returned no response. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Chat API Error]', error.message);
    return new Response(
      JSON.stringify({
        error: 'Something went wrong. Please try again in a moment.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
