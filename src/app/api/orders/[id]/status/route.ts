import { NextResponse } from 'next/server';
import { query } from '@/lib/dbUtils';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface StatusUpdateRequest {
  status: OrderStatus;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: StatusUpdateRequest = await request.json();
    const { status } = body;
    const orderId = parseInt(params.id);

    console.log('Updating order status:', { orderId, status });

    // Validate order ID
    if (isNaN(orderId)) {
      console.error('Invalid order ID:', params.id);
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      console.error('Invalid status:', status);
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if order exists and get current status
    const [existingOrder] = await query(
      'SELECT id, status FROM orders WHERE id = ?',
      [orderId]
    );

    if (!existingOrder) {
      console.error('Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Current order status:', existingOrder.status);

    // Update order status
    try {
      await query(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId]
      );
    } catch (error) {
      console.error('Error updating status:', error);
      return NextResponse.json(
        { 
          error: 'Failed to update order status',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Verify the update
    const [updatedOrder] = await query(
      'SELECT id, status FROM orders WHERE id = ?',
      [orderId]
    );

    if (!updatedOrder || updatedOrder.status !== status) {
      console.error('Status update verification failed:', { 
        orderId, 
        expectedStatus: status, 
        actualStatus: updatedOrder?.status 
      });
      return NextResponse.json(
        { error: 'Failed to verify status update' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update order status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 