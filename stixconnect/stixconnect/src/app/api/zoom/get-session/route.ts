import { NextResponse } from "next/server";
import { ZoomVideo } from "@zoom/videosdk";
import { createHmac } from 'crypto';

export async function POST(request: Request) {
  try {
    const { consultationId, userRole, userName } = await request.json();

    // Check environment variables
    if (!process.env.ZOOM_SDK_KEY || !process.env.ZOOM_SDK_SECRET) {
      return NextResponse.json(
        { error: "Zoom SDK credentials not configured" },
        { status: 500 }
      );
    }

// Generate session token for Zoom Video SDK
    const sdkKey = process.env.ZOOM_VIDEO_SDK_KEY || process.env.ZOOM_SDK_KEY;
    const sdkSecret = process.env.ZOOM_VIDEO_SDK_SECRET || process.env.ZOOM_SDK_SECRET;
    const sessionName = `Consulta-${consultationId}`;
    const password = Math.random().toString(36).substring(2, 8);

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json(
        { error: "Zoom Video SDK credentials not configured. Please check ZOOM_VIDEO_SDK_KEY and ZOOM_VIDEO_SDK_SECRET" },
        { status: 500 }
      );
    }

    // Generate JWT token for session
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours
    const oHeader = { alg: "HS256", typ: "JWT" };
    
    const oPayload = {
      app_key: sdkKey,
      iat: iat,
      exp: exp,
      tpc: sessionName,
      pwd: password,
      role_type: userRole === 'patient' ? 0 : 1, // 0 = attendee/patient, 1 = host/staff
      user_identity: userName,
      session_key: consultationId,
    };

    // Proper JWT encoding with HMAC-SHA256
    const signature = generateJWT(oHeader, oPayload, sdkSecret);

    return NextResponse.json({
      signature, // Use 'signature' as per Zoom SDK documentation
      sessionName,
      password,
      userName,
      role: userRole,
      sessionKey: consultationId
    });

  } catch (error: any) {
    console.error("Error creating Zoom session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

// Proper JWT generation with HMAC-SHA256
function generateJWT(header: any, payload: any, secret: string): string {
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

// Generate a random meeting ID
function generateMeetingId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}