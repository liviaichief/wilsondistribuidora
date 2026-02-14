-- FIX STORAGE PERMISSIONS
-- 1. Enable RLS on objects (usually authorized by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Allow Public Read Access (So images appear on the site)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'product-images' );

-- 3. Allow Authenticated Uploads (Fix for your error)
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- 4. Allow Updates/Deletes for Admin
CREATE POLICY "Admin Update Delete"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-images' );

CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-images' );
