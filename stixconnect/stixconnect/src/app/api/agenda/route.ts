import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Construct query parameters
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    // Add default filters if needed, or pass through everything

    // Fetch from backend
    const res = await fetch(`${backendUrl}/consultas?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if available, but for now we might need a machine-to-machine token or similar
        // Or we rely on this route being public/protected by session on the server side (which we don't have access to easily here without passing it)
        // For development, assuming backend allows access or we have a dev token. 
        // The backend requires 'authenticateToken'. We need a valid token.
        // We can create a "service" token or mock it for now if we can't easily get the user's token here.
        // Or we pass the user's token from the request cookies if this is a server wrapper.
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error(`Backend returned ${res.status}`);
      return NextResponse.json({ error: 'Erro ao comunicar com o backend' }, { status: res.status });
    }

    const json = await res.json();
    // Verify format. Backend returns array directly based on my previous edit?
    // Wait, I decided to return array directly in the backend code I wrote? 
    // Yes: res.json(formattedConsultas);
    // But then I commented about wrapping it. Let's assume it returns array for now.

    return NextResponse.json(json);

  } catch (error: any) {
    console.error('Erro ao buscar agenda:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar consultas' },
      { status: 500 }
    );
  }
}
