import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

async function fixStatusEnum() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME}`);
    
    // First, update any existing orders with invalid status to 'pending'
    await connection.query(`
      UPDATE orders 
      SET status = 'pending' 
      WHERE status NOT IN ('pending', 'processing', 'completed', 'cancelled')
    `);
    console.log('Updated invalid status values to pending');

    // Drop and recreate the status column with correct enum values
    await connection.query(`
      ALTER TABLE orders 
      MODIFY COLUMN status ENUM('pending', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'
    `);
    console.log('Successfully updated status enum values');

  } catch (error) {
    console.error('Error fixing status enum:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the fix
fixStatusEnum()
  .then(() => {
    console.log('Status enum fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Status enum fix failed:', error);
    process.exit(1);
  }); 