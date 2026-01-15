-- Jalankan script ini di SQL Editor Supabase Dashboard Anda
-- Link: https://supabase.com/dashboard/project/_/sql/new

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS instansi text;

-- Pastikan permission policy mengizinkan update kolom ini jika Anda menggunakan RLS (Row Level Security)
-- Namun karena backend menggunakan Service Key, ini biasanya otomatis ter-bypass.
