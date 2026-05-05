export async function POST(request) {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

  try {
    const body = await request.json();

    // Validate required fields before forwarding
    if (!body.question || !body.context) {
      return new Response(
        JSON.stringify({ error: 'Missing question or context' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch(`${backendBase}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.text();

    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Chat API Error]', error.message);
    return new Response(
      JSON.stringify({ 
        error: 'AI service is currently unavailable. Please try again in a moment.',
        details: error.message 
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
