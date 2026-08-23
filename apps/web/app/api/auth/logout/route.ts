import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
