import { NextResponse } from 'next/server';
import { query } from '@/lib/dbUtils';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '@/lib/db';

interface ProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
}

interface Product extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  created_at: Date;
  updated_at: Date;
  images: ProductImage[];
}

export async function GET() {
  try {
    // Get products with their images
    const results = await query(`
      SELECT p.*, 
        COALESCE(
          JSON_ARRAYAGG(
            IF(pi.id IS NOT NULL,
              JSON_OBJECT(
                'id', pi.id,
                'url', pi.image_url,
                'isPrimary', pi.is_primary
              ),
              NULL
            )
          ),
          JSON_ARRAY()
        ) as images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id, p.name, p.description, p.price, p.stock, p.category, p.created_at, p.updated_at
      ORDER BY p.created_at DESC
    `) as Product[];

    if (!Array.isArray(results)) {
      console.error('Unexpected query result format:', results);
      throw new Error('Invalid query result format');
    }

    // The images are already in JSON format from MySQL
    return NextResponse.json(
      results.map((product) => ({
        ...product,
        images: product.images || []
      }))
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Get a connection from the pool
  const connection = await pool.getConnection();
  
  try {
    const formData = await request.formData();
    
    // Extract product data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string);
    const category = formData.get('category') as string;
    
    // Handle image uploads
    const images = formData.getAll('images') as File[];
    const imageUrls: string[] = [];

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating uploads directory:', error);
      throw new Error('Failed to create uploads directory');
    }

    // Save each image
    for (const image of images) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${image.name}`;
      const path = join(uploadDir, filename);
      
      try {
        await writeFile(path, buffer);
        imageUrls.push(`/uploads/${filename}`);
      } catch (error) {
        console.error('Error saving image:', error);
        throw new Error('Failed to save image');
      }
    }

    try {
      // Start transaction
      await connection.beginTransaction();

      // Insert product into database
      const [result] = await connection.execute(
        'INSERT INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
        [name, description, price, stock, category]
      ) as [ResultSetHeader, unknown];

      const productId = result.insertId;

      // Insert images into product_images table
      for (let i = 0; i < imageUrls.length; i++) {
        await connection.execute(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [productId, imageUrls[i], i === 0] // First image is primary
        );
      }

      // Commit the transaction
      await connection.commit();

      // Get the created product with its images
      const [rows] = await connection.execute(`
        SELECT p.*, 
          COALESCE(
            JSON_ARRAYAGG(
              IF(pi.id IS NOT NULL,
                JSON_OBJECT(
                  'id', pi.id,
                  'url', pi.image_url,
                  'isPrimary', pi.is_primary
                ),
                NULL
              )
            ),
            JSON_ARRAY()
          ) as images
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        WHERE p.id = ?
        GROUP BY p.id, p.name, p.description, p.price, p.stock, p.category, p.created_at, p.updated_at
      `, [productId]) as [Product[], unknown];

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Failed to retrieve created product');
      }

      const newProduct = rows[0];

      return NextResponse.json({
        ...newProduct,
        images: newProduct.images || []
      });
    } catch (error) {
      // Rollback the transaction on error
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
} 