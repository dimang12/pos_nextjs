import { NextResponse } from 'next/server';
import { query } from '@/lib/dbUtils';
import { RowDataPacket } from 'mysql2';

interface SummaryResult extends RowDataPacket {
  total_orders: number;
  total_sales: number;
  average_order_value: number;
}

interface TopProduct extends RowDataPacket {
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
}

interface DailySale extends RowDataPacket {
  date: string;
  order_count: number;
  total_sales: number;
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

    // Get total sales and orders
    console.log('Fetching summary data...');
    const [summaryResult] = await query<SummaryResult[]>(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      AND status = 'completed'
    `, [startDate, endDate]);
    console.log('Summary result:', summaryResult);

    // Get top products
    console.log('Fetching top products...');
    const topProducts = await query<TopProduct[]>(`
      SELECT 
        p.name as product_name,
        COALESCE(SUM(oi.quantity), 0) as quantity_sold,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at BETWEEN ? AND ?
      AND o.status = 'completed'
      GROUP BY p.id, p.name
      ORDER BY quantity_sold DESC
      LIMIT 10
    `, [startDate, endDate]);
    console.log('Top products:', topProducts);

    // Get daily sales
    console.log('Fetching daily sales...');
    const dailySales = await query<DailySale[]>(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(total_amount), 0) as total_sales
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate, endDate]);
    console.log('Daily sales:', dailySales);

    const response = {
      total_sales: Number(summaryResult.total_sales) || 0,
      total_orders: Number(summaryResult.total_orders) || 0,
      average_order_value: Number(summaryResult.average_order_value) || 0,
      top_products: topProducts.map(product => ({
        product_name: product.product_name,
        quantity_sold: Number(product.quantity_sold),
        total_revenue: Number(product.total_revenue)
      })),
      sales_by_date: dailySales.map(day => ({
        date: day.date,
        order_count: Number(day.order_count),
        total_sales: Number(day.total_sales)
      }))
    };

    console.log('Sending response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating sales report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate sales report' },
      { status: 500 }
    );
  }
} 