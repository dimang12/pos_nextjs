import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse(null, { status: 401 });
    }

    // Verify the token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    verify(token, secret);
    return new NextResponse(null, { status: 200 });
  } catch {
    // return new NextResponse(null, { status: 401 });
  }
} 