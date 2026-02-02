/*
  # Create Equipment Categories Table

  1. New Tables
    - `equipment_categories`
      - `id` (uuid, primary key) - Unique identifier for the category
      - `name` (text, unique) - Category name
      - `created_at` (timestamptz) - When the category was created
      - `updated_at` (timestamptz) - When the category was last updated
  
  2. Security
    - Enable RLS on `equipment_categories` table
    - Add policy for authenticated users to read all categories
    - Add policy for authenticated users to create, update, and delete categories
  
  3. Initial Data
    - Insert default categories (Basketball, Football, Soccer, Tennis, Volleyball, Other)
*/

CREATE TABLE IF NOT EXISTS equipment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON equipment_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON equipment_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON equipment_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON equipment_categories FOR DELETE
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO equipment_categories (name)
VALUES 
  ('Basketball'),
  ('Football'),
  ('Soccer'),
  ('Tennis'),
  ('Volleyball'),
  ('Other')
ON CONFLICT (name) DO NOTHING;