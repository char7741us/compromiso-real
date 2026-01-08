-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: Leaders (Líderes)
create table if not exists public.leaders (
    id uuid primary key default uuid_generate_v4(),
    full_name text not null,
    document_number text, -- Optional, if we ever get it
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Constraint to avoid duplicate leaders by name (simplistic approach for now)
    constraint leaders_name_key unique (full_name)
);

-- Table: Voters (Votantes)
create table if not exists public.voters (
    id uuid primary key default uuid_generate_v4(),
    leader_id uuid references public.leaders(id) on delete set null,
    
    first_name text not null,
    last_name text not null,
    document_number text not null,
    phone text,
    address text,
    neighborhood text,
    municipality text,
    department text,
    
    voting_post text,
    voting_post_address text,
    voting_table text,
    voting_municipality text,
    voting_department text,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Prevent duplicate voters by document number
    constraint voters_document_number_key unique (document_number)
);

-- RLS Policies (Row Level Security) - Optional but recommended
alter table public.leaders enable row level security;
alter table public.voters enable row level security;

-- For development/prototype, allow public access (WARNING: NOT FOR PRODUCTION)
-- You should ideally configure auth policies later
create policy "Enable all access for now" on public.leaders for all using (true) with check (true);
create policy "Enable all access for now" on public.voters for all using (true) with check (true);
