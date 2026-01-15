-- 1. Create categories table if not exists
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Everyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Admin and Uploader can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admin and Uploader can delete categories" ON public.categories;

-- 4. Create Read Policy (Everyone)
CREATE POLICY "Everyone can read categories" ON public.categories
  FOR SELECT USING (true);

-- 5. Create Insert Policy (Admin, Manager, Uploader)
CREATE POLICY "Admin and Uploader can insert categories" ON public.categories
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role in ('admin', 'manager', 'uploader')
    )
  );

-- 6. Create Delete Policy (Admin, Manager, Uploader)
CREATE POLICY "Admin and Uploader can delete categories" ON public.categories
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    exists (
      select 1 from public.users 
      where id = auth.uid() 
      and role in ('admin', 'manager', 'uploader', 'viewer')
    )
  );

-- 7. Insert default categories if not exist (Optional)
INSERT INTO public.categories (name) VALUES 
('Prosedur'), 
('Instruksi Kerja'), 
('Materi')
ON CONFLICT (name) DO NOTHING;
