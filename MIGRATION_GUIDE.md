# Migration Guide: Mock Services to Supabase

This document outlines the steps to migrate from local mock services to Supabase for the AutoFlowX application.

## Prerequisites

1. Create a Supabase project at [https://app.supabase.com](https://app.supabase.com)
2. Get your project URL and anon/public key from Project Settings > API
3. Create a `.env` file based on `.env.example` and add your Supabase credentials

## Database Setup

1. **Create Tables**
   Run the following SQL in the Supabase SQL Editor to create the required tables:

   ```sql
   -- Enable UUID extension if not already enabled
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Clients table
   CREATE TABLE IF NOT EXISTS clients (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT NOT NULL,
     address TEXT,
     city TEXT,
     country TEXT,
     tax_id TEXT,
     notes TEXT,
     profile_image JSONB,
     insurance_info JSONB DEFAULT '{}'::jsonb,
     user_id UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Vehicles table
   CREATE TABLE IF NOT EXISTS vehicles (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
     make TEXT NOT NULL,
     model TEXT NOT NULL,
     year TEXT NOT NULL,
     vin TEXT,
     license_plate TEXT NOT NULL,
     color TEXT,
     mileage INTEGER,
     fuel_type TEXT,
     transmission TEXT,
     engine_size TEXT,
     images JSONB DEFAULT '[]'::jsonb,
     notes TEXT,
     last_service_date TIMESTAMPTZ,
     next_service_date TIMESTAMPTZ,
     service_history JSONB DEFAULT '[]'::jsonb,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     user_id UUID REFERENCES auth.users(id)
   );

   -- Enable Row Level Security
   ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
   ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

   -- Create policies for clients
   CREATE POLICY "Enable read access for authenticated users" 
   ON clients FOR SELECT 
   USING (auth.role() = 'authenticated');

   CREATE POLICY "Users can manage their own clients"
   ON clients
   FOR ALL
   USING (auth.uid() = user_id);

   -- Create policies for vehicles
   CREATE POLICY "Enable read access for authenticated users on vehicles"
   ON vehicles FOR SELECT
   USING (auth.role() = 'authenticated');

   CREATE POLICY "Users can manage their own vehicles"
   ON vehicles
   FOR ALL
   USING (auth.uid() = user_id);
   ```

2. **Create Search Function**
   Add this function to enable full-text search:

   ```sql
   -- Search function for clients
   CREATE OR REPLACE FUNCTION search_clients(search_term TEXT)
   RETURNS SETOF clients AS $$
   BEGIN
     RETURN QUERY
     SELECT *
     FROM clients
     WHERE 
       to_tsvector('english', 
         COALESCE(name, '') || ' ' ||
         COALESCE(email, '') || ' ' ||
         COALESCE(phone, '') || ' ' ||
         COALESCE(address, '')
       ) @@ plainto_tsquery('english', search_term);
   END;
   $$ LANGUAGE plpgsql;

   -- Search function for vehicles
   CREATE OR REPLACE FUNCTION search_vehicles(search_term TEXT)
   RETURNS SETOF vehicles AS $$
   BEGIN
     RETURN QUERY
     SELECT *
     FROM vehicles
     WHERE 
       to_tsvector('english',
         COALESCE(make, '') || ' ' ||
         COALESCE(model, '') || ' ' ||
         COALESCE(license_plate, '') || ' ' ||
         COALESCE(vin, '') || ' ' ||
         COALESCE(CAST(year AS TEXT), '')
       ) @@ plainto_tsquery('english', search_term);
   END;
   $$ LANGUAGE plpgsql;

   -- Create indexes for better search performance
   CREATE INDEX IF NOT EXISTS idx_clients_search ON clients 
   USING GIN (to_tsvector('english', 
     COALESCE(name, '') || ' ' ||
     COALESCE(email, '') || ' ' ||
     COALESCE(phone, '') || ' ' ||
     COALESCE(address, '')
   ));

   CREATE INDEX IF NOT EXISTS idx_vehicles_search ON vehicles
   USING GIN (to_tsvector('english',
     COALESCE(make, '') || ' ' ||
     COALESCE(model, '') || ' ' ||
     COALESCE(license_plate, '') || ' ' ||
     COALESCE(vin, '') || ' ' ||
     COALESCE(CAST(year AS TEXT), '')
   ));

   -- Orders table
   CREATE TYPE order_status AS ENUM (
     'reception',
     'diagnosis',
     'waiting_parts',
     'in_progress',
     'quality_check',
     'completed',
     'delivered',
     'cancelled'
   );

   CREATE TYPE payment_status AS ENUM (
     'pending',
     'partial',
     'paid',
     'refunded'
   );

   CREATE TYPE item_status AS ENUM (
     'pending',
     'ordered',
     'received',
     'installed'
   );

   CREATE TYPE process_status AS ENUM (
     'pending',
     'in_progress',
     'completed',
     'cancelled'
   );

   CREATE TABLE IF NOT EXISTS orders (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     number TEXT NOT NULL,
     client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
     vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
     technician_id UUID NOT NULL REFERENCES auth.users(id),
     status order_status NOT NULL DEFAULT 'reception',
     description TEXT,
     diagnosis TEXT,
     notes TEXT,
     priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
     estimated_completion_date TIMESTAMPTZ,
     completion_date TIMESTAMPTZ,
     payment_status payment_status NOT NULL DEFAULT 'pending',
     payment_method TEXT,
     payment_notes TEXT,
     subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
     tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
     discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
     total NUMERIC(10, 2) GENERATED ALWAYS AS (subtotal + tax - discount) STORED,
     paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
     balance NUMERIC(10, 2) GENERATED ALWAYS AS (total - paid_amount) STORED,
     warranty JSONB DEFAULT '{"parts": 0, "labor": 0}',
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     user_id UUID REFERENCES auth.users(id)
   );

   -- Order items table
   CREATE TABLE IF NOT EXISTS order_items (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     description TEXT,
     quantity INTEGER NOT NULL DEFAULT 1,
     unit_price NUMERIC(10, 2) NOT NULL,
     total_price NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
     part_number TEXT,
     supplier TEXT,
     status item_status NOT NULL DEFAULT 'pending',
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     user_id UUID REFERENCES auth.users(id)
   );

   -- Order images table
   CREATE TABLE IF NOT EXISTS order_images (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     url TEXT NOT NULL,
     description TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     user_id UUID REFERENCES auth.users(id)
   );

   -- Order comments table
   CREATE TABLE IF NOT EXISTS order_comments (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     user_id UUID NOT NULL REFERENCES auth.users(id),
     user_name TEXT NOT NULL,
     user_avatar TEXT,
     content TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Repair processes table
   CREATE TABLE IF NOT EXISTS repair_processes (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     description TEXT,
     start_date TIMESTAMPTZ NOT NULL,
     end_date TIMESTAMPTZ,
     status process_status NOT NULL DEFAULT 'pending',
     technician_id UUID NOT NULL REFERENCES auth.users(id),
     technician_name TEXT NOT NULL,
     notes TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     user_id UUID REFERENCES auth.users(id)
   );

   -- Process images table
   CREATE TABLE IF NOT EXISTS process_images (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     process_id UUID NOT NULL REFERENCES repair_processes(id) ON DELETE CASCADE,
     url TEXT NOT NULL,
     description TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     user_id UUID REFERENCES auth.users(id)
   );

   -- Enable Row Level Security for new tables
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE order_images ENABLE ROW LEVEL SECURITY;
   ALTER TABLE order_comments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE repair_processes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE process_images ENABLE ROW LEVEL SECURITY;

   -- Create policies for orders
   CREATE POLICY "Enable read access for authenticated users on orders"
   ON orders FOR SELECT
   USING (auth.role() = 'authenticated');

   CREATE POLICY "Users can manage their own orders"
   ON orders
   FOR ALL
   USING (auth.uid() = user_id);

   -- Create policies for order items
   CREATE POLICY "Users can manage order items for their orders"
   ON order_items
   FOR ALL
   USING (EXISTS (
     SELECT 1 FROM orders 
     WHERE orders.id = order_items.order_id 
     AND orders.user_id = auth.uid()
   ));

   -- Create policies for order comments
   CREATE POLICY "Users can view comments for their orders"
   ON order_comments
   FOR SELECT
   USING (EXISTS (
     SELECT 1 FROM orders 
     WHERE orders.id = order_comments.order_id 
     AND orders.user_id = auth.uid()
   ));

   CREATE POLICY "Users can add comments to their orders"
   ON order_comments
   FOR INSERT
   WITH CHECK (EXISTS (
     SELECT 1 FROM orders 
     WHERE orders.id = order_comments.order_id 
     AND orders.user_id = auth.uid()
   ));

   -- Create indexes for better performance
   CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
   CREATE INDEX IF NOT EXISTS idx_orders_vehicle_id ON orders(vehicle_id);
   CREATE INDEX IF NOT EXISTS idx_orders_technician_id ON orders(technician_id);
   CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
   CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
   CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
   CREATE INDEX IF NOT EXISTS idx_repair_processes_order_id ON repair_processes(order_id);

   -- Create search function for orders
   CREATE OR REPLACE FUNCTION search_orders(search_term TEXT)
   RETURNS SETOF orders AS $$
   BEGIN
     RETURN QUERY
     SELECT o.*
     FROM orders o
     JOIN clients c ON o.client_id = c.id
     JOIN vehicles v ON o.vehicle_id = v.id
     WHERE 
       to_tsvector('english',
         COALESCE(o.number, '') || ' ' ||
         COALESCE(o.description, '') || ' ' ||
         COALESCE(o.diagnosis, '') || ' ' ||
         COALESCE(o.notes, '') || ' ' ||
         COALESCE(c.name, '') || ' ' ||
         COALESCE(v.make, '') || ' ' ||
         COALESCE(v.model, '') || ' ' ||
         COALESCE(v.license_plate, '') || ' ' ||
         COALESCE(CAST(v.year AS TEXT), '')
       ) @@ plainto_tsquery('english', search_term);
   END;
   $$ LANGUAGE plpgsql;

   -- Create index for order search
   CREATE INDEX IF NOT EXISTS idx_orders_search ON orders
   USING GIN (to_tsvector('english',
     COALESCE(number, '') || ' ' ||
     COALESCE(description, '') || ' ' ||
     COALESCE(diagnosis, '') || ' ' ||
     COALESCE(notes, '')
   ));
   ```

## Service Migration

1. **Update Service Imports**
   Replace mock service imports with Supabase service imports:

   ```typescript
   // Before
   import * as clientService from './services/client-service';
   
   // After
   import { clientService } from './services/supabase/client-service';
   ```

2. **Update Service Usage**
   - Replace mock service method calls with their Supabase equivalents
   - Handle promises appropriately as all Supabase methods are async
   - Update error handling to handle Supabase-specific errors

## Authentication

1. **Update Auth Context**
   Modify your authentication context to use Supabase Auth:

   ```typescript
   import { supabase } from '../lib/supabase';

   const signIn = async (email: string, password: string) => {
     const { data, error } = await supabase.auth.signInWithPassword({
       email,
       password,
     });
     
     if (error) throw error;
     return data;
   };
   ```

## Testing

1. **Unit Tests**
   Update tests to use a test Supabase instance or mock the Supabase client

2. **E2E Tests**
   Update end-to-end tests to work with the Supabase backend

## Deployment

1. **Environment Variables**
   Ensure all required environment variables are set in your deployment environment

2. **Database Migrations**
   Set up a migration system for future database changes

## Rollback Plan

1. Keep the original mock services in version control
2. Use feature flags to toggle between mock and Supabase services during development
3. Have a rollback plan in case of issues with the Supabase migration

## Monitoring

1. Set up Supabase dashboard monitoring
2. Add error tracking for Supabase API calls
3. Monitor performance and adjust indexes as needed
