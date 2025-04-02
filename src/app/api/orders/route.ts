import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    const orders = await db.query(`
      SELECT 
        o.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    // Parse the items JSON string for each order
    const formattedOrders = orders.map((order: any) => ({
      ...order,
      items: order.items ? JSON.parse(`[${order.items}]`) : []
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_name, total_amount, payment_method, items } = body;

    // Start a transaction
    await db.query('BEGIN');

    // Insert the order
    const [order] = await db.query(
      `INSERT INTO orders (order_number, customer_name, total_amount, payment_method, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [
        `ORD-${Date.now()}`,
        customer_name,
        total_amount,
        payment_method
      ]
    );

    // Insert order items
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [
          order.insertId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal
        ]
      );

      // Update product stock
      await db.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await db.query('COMMIT');

    return NextResponse.json({ 
      message: 'Order created successfully',
      orderId: order.insertId 
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 