import { NextResponse } from 'next/server';
import { query } from '@/lib/dbUtils';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { RowDataPacket } from 'mysql2';
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      WHERE p.id = ?
      GROUP BY p.id, p.name, p.description, p.price, p.stock, p.category, p.created_at, p.updated_at
    `, [params.id]) as Product[];

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...results[0],
      images: results[0].images || []
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

      // Update product in database
      await connection.execute(
        'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ? WHERE id = ?',
        [name, description, price, stock, category, params.id]
      );

      // Delete existing images
      const [existingImages] = await connection.execute(
        'SELECT image_url FROM product_images WHERE product_id = ?',
        [params.id]
      ) as [RowDataPacket[], unknown];

      // Delete image files
      for (const image of existingImages) {
        const imagePath = join(process.cwd(), 'public', image.image_url);
        try {
          await unlink(imagePath);
        } catch (error) {
          console.error('Error deleting image file:', error);
        }
      }

      // Delete image records
      await connection.execute(
        'DELETE FROM product_images WHERE product_id = ?',
        [params.id]
      );

      // Insert new images
      for (let i = 0; i < imageUrls.length; i++) {
        await connection.execute(
          'INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, ?)',
          [params.id, imageUrls[i], i === 0] // First image is primary
        );
      }

      // Commit the transaction
      await connection.commit();

      // Get the updated product with its images
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
      `, [params.id]) as [Product[], unknown];

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Failed to retrieve updated product');
      }

      return NextResponse.json({
        ...rows[0],
        images: rows[0].images || []
      });
    } catch (error) {
      // Rollback the transaction on error
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    // Start transaction
    await connection.beginTransaction();

    // Get product images to delete files
    const [images] = await connection.execute(
      'SELECT image_url FROM product_images WHERE product_id = ?',
      [params.id]
    ) as [RowDataPacket[], unknown];

    // Delete image files
    for (const image of images) {
      const imagePath = join(process.cwd(), 'public', image.image_url);
      try {
        await unlink(imagePath);
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }

    // Delete product images from database
    await connection.execute(
      'DELETE FROM product_images WHERE product_id = ?',
      [params.id]
    );

    // Delete product from database
    await connection.execute(
      'DELETE FROM products WHERE id = ?',
      [params.id]
    );

    // Commit the transaction
    await connection.commit();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Rollback the transaction on error
    await connection.rollback();
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    );
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
} 