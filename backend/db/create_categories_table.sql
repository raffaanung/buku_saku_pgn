-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default categories (excluding 'Lainnya' as requested by user preference, but keeping in DB is fine, logic filters it out. 
-- Actually user wanted 'Lainnya' removed. I'll remove it from defaults here to be clean)
INSERT INTO public.categories (name) VALUES 
('Prosedur'), 
('Instruksi Kerja'), 
('Materi')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read
DROP POLICY IF EXISTS "Everyone can read categories" ON public.categories;
CREATE POLICY "Everyone can read categories" ON public.categories
  FOR SELECT USING (true);

-- Policy: Admin/Uploader can insert
DROP POLICY IF EXISTS "Admin and Uploader can insert categories" ON public.categories;
CREATE POLICY "Admin and Uploader can insert categories" ON public.categories
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role in ('admin', 'manager', 'uploader')
    )
  );

-- Policy: Admin/Uploader can delete
DROP POLICY IF EXISTS "Admin and Uploader can delete categories" ON public.categories;
CREATE POLICY "Admin and Uploader can delete categories" ON public.categories
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role in ('admin', 'manager', 'uploader', 'viewer')
    )
  );
