import { NextResponse } from "next/server";
import { createHmac } from 'crypto';

// Proper JWT generation for Zoom REST API
function generateJWT(appKey: string, appSecret: string): string {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60; // 1 hour
  const oHeader = { alg: "HS256", typ: "JWT" };
  
  const oPayload = {
    iss: appKey,
    exp: exp
  };

  const headerB64 = Buffer.from(JSON.stringify(oHeader)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(oPayload)).toString("base64url");
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = createHmac('sha256', appSecret)
    .update(signatureInput)
    .digest('base64url');
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

async function getZoomToken() {
  if (!process.env.ZOOM_API_KEY || !process.env.ZOOM_API_SECRET) {
    throw new Error("Zoom API credentials not configured");
  }
  
  return generateJWT(process.env.ZOOM_API_KEY, process.env.ZOOM_API_SECRET);
}

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    const token = await getZoomToken();

    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        type: 1, // reunião instantânea (sem agendamento)
        settings: {
          join_before_host: true,
          approval_type: 0,
          audio: "both",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Zoom:", data);
      return NextResponse.json({ error: data }, { status: 400 });
    }

    return NextResponse.json({
      join_url: data.join_url,
      start_url: data.start_url,
      meeting_id: data.id,
    });
  } catch (error: any) {
    console.error("Erro Zoom:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
