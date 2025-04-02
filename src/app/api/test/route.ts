import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const isConnected = await testConnection();
    return NextResponse.json({ 
      success: true, 
      message: isConnected ? 'Database connected successfully' : 'Failed to connect to database' 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Error testing database connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 