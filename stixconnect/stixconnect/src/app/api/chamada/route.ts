import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE!;

const client = twilio(accountSid, authToken);

export async function POST(req: Request) {
  const body = await req.json();
  const { numeroA, numeroB } = body;

  try {
    const call = await client.calls.create({
      to: numeroA,
      from: twilioPhone,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/conectar?numeroB=${encodeURIComponent(numeroB)}`,
      record: true,
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/gravacao`,
    });

    return NextResponse.json({ success: true, callSid: call.sid });
  } catch (error) {
    console.error('Erro na chamada:', error);
    return NextResponse.json({ success: false, error });
  }
}
