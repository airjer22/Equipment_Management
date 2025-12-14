/*
  # Create Equipment Images Storage Bucket

  1. Storage Setup
    - Create `equipment-images` storage bucket for equipment photos
    - Set bucket to public so images can be accessed without authentication
    - Add storage policies for authenticated users to upload/manage images

  2. Security
    - Allow authenticated users to upload images
    - Allow authenticated users to update their uploaded images
    - Allow public read access to all images
    - Allow authenticated users to delete images
*/

-- Create the storage bucket for equipment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-images', 'equipment-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload equipment images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'equipment-images');

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update equipment images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'equipment-images')
  WITH CHECK (bucket_id = 'equipment-images');

-- Allow public read access to all equipment images
CREATE POLICY "Anyone can view equipment images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'equipment-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete equipment images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'equipment-images');