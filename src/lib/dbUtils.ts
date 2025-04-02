import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'next_pos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query<T extends RowDataPacket[]>(sql: string, params: (string | number | Date)[] = []) {
  const [rows] = await pool.execute<T>(sql, params);
  return rows;
}

export async function insert(table: string, data: Record<string, any>) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  
  try {
    const [result] = await pool.execute(sql, values);
    return result;
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

export async function update(table: string, data: Record<string, any>, where: string, whereParams: any[] = []) {
  const setClause = Object.keys(data)
    .map(key => `${key} = ?`)
    .join(', ');
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
  
  try {
    const [result] = await pool.execute(sql, [...Object.values(data), ...whereParams]);
    return result;
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
}

export async function remove(table: string, where: string, params: any[] = []) {
  const sql = `DELETE FROM ${table} WHERE ${where}`;
  
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Database delete error:', error);
    throw error;
  }
}

export default pool; 