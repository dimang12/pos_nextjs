import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

admin.initializeApp();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Middleware to verify JWT token
const verifyToken = async (req: functions.https.Request) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Auth endpoints
export const login = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { email, password } = req.body;
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    const user = users[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Products endpoints
export const getProducts = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const [products] = await pool.execute(`
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
      GROUP BY p.id
    `);

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Orders endpoints
export const getOrders = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    await verifyToken(req);
    const [orders] = await pool.execute(`
      SELECT o.*, 
        COALESCE(
          JSON_ARRAYAGG(
            IF(oi.id IS NOT NULL,
              JSON_OBJECT(
                'id', oi.id,
                'productId', oi.product_id,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price,
                'subtotal', oi.subtotal
              ),
              NULL
            )
          ),
          JSON_ARRAY()
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add more endpoints as needed... 