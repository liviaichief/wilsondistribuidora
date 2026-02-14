
-- Verify and Fix Storage Policies for product-images bucket

-- 1. Ensure the bucket exists (this is usually done via UI, but policies depend on it)
-- We can't create buckets via SQL in all Supabase setups, but we can set policies.

-- 2. Allow Public Read Access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'product-images' );

-- 3. Allow Authenticated Uploads
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- 4. Allow Updates/Deletes for Admin (using public.is_admin() function if available, else authenticated for now)
-- Assuming is_admin() exists based on previous files.
DROP POLICY IF EXISTS "Admin Update Delete" ON storage.objects;
CREATE POLICY "Admin Update Delete"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-images' );

-- 5. List policies to verify
select * from pg_policies where schemaname = 'storage' and tablename = 'objects';
