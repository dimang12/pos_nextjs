import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export async function GET() {
  const connection = await pool.getConnection();
  try {
    const [orders] = await connection.query(`
      SELECT 
        o.*,
        c.name as customer_name,
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
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    // Parse the items JSON string for each order
    const formattedOrders = (orders as any[]).map((order) => ({
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
  } finally {
    connection.release();
  }
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    console.log('Received order data:', body); // Log the received data

    const { customerId, total_amount, payment_method, items } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Get customer name
      const [customerRows] = await connection.query(
        'SELECT name FROM customers WHERE id = ?',
        [customerId]
      ) as [any[], unknown];

      if (!customerRows.length) {
        throw new Error('Customer not found');
      }

      const customerName = customerRows[0].name;

      // Insert the order
      const [orderResult] = await connection.query(
        `INSERT INTO orders (order_number, customer_id, customer_name, total_amount, payment_method, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [
          `ORD-${Date.now()}`,
          customerId,
          customerName,
          total_amount,
          payment_method
        ]
      ) as [ResultSetHeader, unknown];

      const orderId = orderResult.insertId;

      // Insert order items and update product stock
      for (const item of items) {
        // Check stock availability
        const [productRows] = await connection.query(
          'SELECT stock FROM products WHERE id = ?',
          [item.product_id]
        ) as [any[], unknown];

        if (!productRows.length) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }

        const currentStock = productRows[0].stock;
        if (currentStock < item.quantity) {
          throw new Error(`Not enough stock for product ID ${item.product_id}`);
        }

        // Insert order item
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.subtotal
          ]
        );

        // Update product stock
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Commit the transaction
      await connection.commit();

      return NextResponse.json({ 
        message: 'Order created successfully',
        orderId 
      });
    } catch (error) {
      // Rollback the transaction on error
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 