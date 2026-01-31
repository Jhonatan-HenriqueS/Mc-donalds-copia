import { NextResponse } from 'next/server';

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { success: false, error: 'VAPID_PUBLIC_KEY não configurada' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, publicKey });
}
