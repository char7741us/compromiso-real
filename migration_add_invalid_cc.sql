-- Migration: Add is_invalid_cc column to voters table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.voters 
ADD COLUMN IF NOT EXISTS is_invalid_cc boolean DEFAULT false;

-- Optional: Create an index for faster filtering of invalid IDs
CREATE INDEX IF NOT EXISTS idx_voters_invalid_cc ON public.voters(is_invalid_cc);
