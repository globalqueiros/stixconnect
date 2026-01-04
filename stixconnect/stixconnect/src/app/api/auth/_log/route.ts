import { NextResponse } from "next/server";

// Mock log endpoint for NextAuth compatibility
export async function POST(request: Request) {
  const body = await request.json();
  
  // Log the error (in production, use proper logging)
  if (body.error) {
    console.error('NextAuth Error:', body.error);
    if (body.details) {
      console.error('Details:', body.details);
    }
  }

  return NextResponse.json({ success: true });
}