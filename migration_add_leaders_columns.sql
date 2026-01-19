-- Add new columns to the leaders table to support the overhaul
ALTER TABLE public.leaders 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS goal integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS zone text,
ADD COLUMN IF NOT EXISTS municipality text,
ADD COLUMN IF NOT EXISTS neighborhood text;

-- Optional: Create bucket for avatars if it doesn't exist
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
