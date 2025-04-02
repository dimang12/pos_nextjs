const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

async function createDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created or already exists`);
    
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME}`);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user', 'cashier') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created successfully');

    // Generate hashed password for admin user
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    try {
      // Insert admin user if not exists
      await connection.query(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin@example.com', hashedPassword, 'Admin User', 'admin']
      );
      console.log('Admin user created successfully');
    } catch (error) {
      // If error is duplicate entry, that's fine
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('Admin user already exists');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
createDatabase()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 