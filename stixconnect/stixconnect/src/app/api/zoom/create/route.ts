import { NextResponse } from "next/server";
import { getZoomToken } from "../../../../lib/zoomAuth";

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
