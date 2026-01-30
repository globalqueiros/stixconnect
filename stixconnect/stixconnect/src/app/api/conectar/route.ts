import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const numeroB = req.nextUrl.searchParams.get('numeroB');

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="pt-BR">Conectando sua chamada. Aguarde um momento.</Say>
  <Dial record="record-from-answer-dual">
    <Number>${numeroB}</Number>
  </Dial>
</Response>`;

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
