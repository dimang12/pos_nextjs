import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [products] = await connection.execute('SELECT * FROM products ORDER BY created_at DESC');
    await connection.end();

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, price, stock, category } = await request.json();

    // Validate input
    if (!name || !price || stock === undefined) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    await connection.execute(
      'INSERT INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, stock, category]
    );

    await connection.end();

    return NextResponse.json(
      { message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { message: 'Failed to create product' },
      { status: 500 }
    );
  }
} 