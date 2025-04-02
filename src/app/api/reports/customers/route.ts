import { NextResponse } from 'next/server';
import { query } from '@/lib/dbUtils';
import { RowDataPacket } from 'mysql2';

interface SummaryResult extends RowDataPacket {
  total_customers: number;
  new_customers: number;
}

interface TopCustomer extends RowDataPacket {
  customer_name: string;
  total_orders: number;
  total_spent: number;
}

interface ReportRequest {
  startDate: string;
  endDate: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const { startDate, endDate } = body as ReportRequest;

    // Get total customers and new customers
    console.log('Fetching customer summary...');
    const [summaryResult] = await query<SummaryResult[]>(`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN created_at BETWEEN ? AND ? THEN 1 END) as new_customers
      FROM customers
    `, [startDate, endDate]);
    console.log('Summary result:', summaryResult);

    // Get top customers
    console.log('Fetching top customers...');
    const topCustomers = await query<TopCustomer[]>(`
      SELECT 
        c.name as customer_name,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE o.created_at BETWEEN ? AND ?
      AND o.status = 'completed'
      GROUP BY c.id, c.name
      ORDER BY total_spent DESC
      LIMIT 10
    `, [startDate, endDate]);
    console.log('Top customers:', topCustomers);

    const response = {
      total_customers: Number(summaryResult.total_customers) || 0,
      new_customers: Number(summaryResult.new_customers) || 0,
      top_customers: topCustomers.map(customer => ({
        customer_name: customer.customer_name,
        total_orders: Number(customer.total_orders),
        total_spent: Number(customer.total_spent)
      }))
    };

    console.log('Sending response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating customer report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate customer report' },
      { status: 500 }
    );
  }
} 