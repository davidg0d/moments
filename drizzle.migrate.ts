import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './shared/schema';

// Initialize PostgreSQL connection
const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

// Run migrations
async function runMigration() {
  console.log('Running database migration...');
  try {
    // Push the schema directly to the database
    await db.execute(/* SQL */ `
      -- Drop existing tables if they exist
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS carts CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS shop_owners CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;
      DROP TABLE IF EXISTS stores CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      
      -- Drop enums if they exist
      DROP TYPE IF EXISTS user_role;
      DROP TYPE IF EXISTS subscription_status;
    `);
    
    console.log('Old tables dropped successfully');
    
    // Recreate the schema
    // First, create ENUM types
    await db.execute(/* SQL */ `
      CREATE TYPE user_role AS ENUM ('admin', 'shopowner', 'customer');
      CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'trial', 'expired');
    `);
    
    // Now create tables
    await db.execute(/* SQL */ `
      -- Create the users table
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'customer',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create the stores table
      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        slug TEXT UNIQUE,
        logo_url TEXT,
        banner_url TEXT,
        company_logo_url TEXT,
        whatsapp_number TEXT NOT NULL,
        instagram_url TEXT,
        facebook_url TEXT,
        show_social_media BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        template_id INTEGER
      );
      
      -- Create the shop_owners table
      CREATE TABLE shop_owners (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        store_id INTEGER REFERENCES stores(id),
        subscription_status subscription_status DEFAULT 'trial',
        subscription_expires_at TIMESTAMP WITH TIME ZONE,
        product_limit INTEGER DEFAULT 30,
        stripe_customer_id TEXT,
        stripe_price_id TEXT,
        stripe_subscription_id TEXT
      );
      
      -- Create the customers table
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        address TEXT,
        phone TEXT
      );
      
      -- Create the categories table
      CREATE TABLE categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create the products table
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        description TEXT,
        image_url TEXT,
        category_id INTEGER REFERENCES categories(id),
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create the carts table
      CREATE TABLE carts (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create the cart_items table
      CREATE TABLE cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DOUBLE PRECISION NOT NULL
      );
      
      -- Create the orders table
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        store_id INTEGER NOT NULL REFERENCES stores(id),
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_address TEXT,
        delivery_method TEXT NOT NULL,
        notes TEXT,
        total DOUBLE PRECISION NOT NULL,
        whatsapp_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create the order_items table
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        quantity INTEGER NOT NULL
      );
    `);
    
    console.log('Schema created successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  await client.end();
  console.log('Migration completed successfully');
}

runMigration();