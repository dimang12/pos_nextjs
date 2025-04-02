import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pos_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const db = {
  query: async (sql: string, params?: (string | number)[]) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
}; 