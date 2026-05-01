export async function GET(request, { params }) {
  const { path } = await params;
  const apiPath = path.join('/');
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
  const backendUrl = `${backendBase}/api/${apiPath}${queryString ? '?' + queryString : ''}`;

  try {
    const res = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Backend unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request, { params }) {
  const { path } = await params;
  const apiPath = path.join('/');
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
  const backendUrl = `${backendBase}/api/${apiPath}`;

  try {
    const body = await request.text();
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Backend unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
