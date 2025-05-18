import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create drizzle database instance with our schema
export const db = drizzle(pool, { schema });

// Test the connection
async function testConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();