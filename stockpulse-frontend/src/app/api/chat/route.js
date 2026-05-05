// Direct NVIDIA Llama 3.1 70B API — no backend dependency
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

function buildSystemPrompt(ctx) {
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
