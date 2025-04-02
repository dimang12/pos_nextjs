import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const { name, email, phone, address } = body;

    await connection.query(
      `UPDATE customers 
       SET name = ?, email = ?, phone = ?, address = ?
       WHERE id = ?`,
      [name, email || null, phone || null, address || null, params.id]
    );

    return NextResponse.json({
      message: 'Customer updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      'DELETE FROM customers WHERE id = ?',
      [params.id]
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 