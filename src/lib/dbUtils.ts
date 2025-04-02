import { pool } from './db';

export async function query(sql: string, params: any[] = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
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