import { NextResponse } from "next/server";

// Mock session endpoint - in production, integrate with your auth system
export async function GET() {
  return NextResponse.json({
    user: {
      id: "mock-user-id",
      name: "Mock User",
      email: "mock@example.com",
      role: "patient" // or "nurse", "doctor"
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
}