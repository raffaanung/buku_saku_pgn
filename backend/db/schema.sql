-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table
create table if not exists public.users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text unique not null,
  password text not null, -- Plain text password
  role text check (role in ('admin', 'manager', 'uploader', 'viewer')) not null default 'viewer',
  position text, -- Jabatan
  passkey text, -- Plain text passkey (Only for admin)
  is_active boolean default true, -- Untuk approval user
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create documents table
create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  file_path text not null,
  file_type text not null,
  file_size integer not null,
  uploaded_by uuid references public.users(id) not null,
  status text check (status in ('pending', 'approved', 'rejected')) not null default 'pending',
  approved_by uuid references public.users(id),
  rejected_by uuid references public.users(id),
  rejection_note text,
  deleted_by uuid references public.users(id),
  category text[], -- Checkbox multi-select
  tags text[],
  content text,
  embedding jsonb,
  fts tsvector, -- Changed to regular column updated by trigger
  deleted_at timestamp with time zone, -- Soft delete support
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for full text search
create index if not exists documents_fts_idx on public.documents using gin (fts);

-- Function to update fts column
create or replace function public.documents_update_fts()
returns trigger as $$
begin
  new.fts := to_tsvector(
    'english',
    coalesce(new.title, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '') || ' ' ||
    coalesce(new.content, '')
  );
  return new;
end;
$$ language plpgsql;

-- Trigger to update fts on insert or update
drop trigger if exists documents_fts_update on public.documents;
create trigger documents_fts_update
before insert or update on public.documents
for each row execute function public.documents_update_fts();

-- Create document history table
create table if not exists public.document_history (
  id uuid default uuid_generate_v4() primary key,
  document_id uuid references public.documents(id) on delete cascade not null,
  changed_by uuid references public.users(id) not null,
  action text not null, -- 'uploaded', 'approved', 'rejected', 'deleted'
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notifications table
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  message text not null,
  is_read boolean default false,
  type text, -- 'document_status', 'registration', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Favorites table: relasi many-to-many antara user dan dokumen
create table if not exists public.favorites (
  user_id uuid references public.users(id) on delete cascade not null,
  document_id uuid references public.documents(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, document_id)
);
