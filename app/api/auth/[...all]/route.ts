// Temporarily stubbed auth route to fix build issues
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Auth route temporarily disabled" }, { status: 501 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Auth route temporarily disabled" }, { status: 501 });
}
