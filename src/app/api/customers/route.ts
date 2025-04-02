import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT * FROM customers
      ORDER BY created_at DESC
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    console.log('Received customer data:', body); // Log the received data

    const { name, email, phone, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const [result] = await connection.query(
      `INSERT INTO customers (name, email, phone, address)
       VALUES (?, ?, ?, ?)`,
      [name, email || null, phone || null, address || null]
    ) as [ResultSetHeader, unknown];

    console.log('Insert result:', result); // Log the insert result

    return NextResponse.json({
      message: 'Customer created successfully',
      customerId: result.insertId
    });
  } catch (error) {
    // Log detailed error information
    console.error('Error creating customer:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any).code,
      sqlMessage: (error as any).sqlMessage,
      sqlState: (error as any).sqlState
    });

    // Return more specific error message
    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'A customer with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create customer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 