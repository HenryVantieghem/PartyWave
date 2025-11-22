-- ============================================================================
-- DATABASE FIXES FOR THE HANGOUT
-- Run this SQL script in Supabase SQL Editor to fix schema mismatches
-- ============================================================================

-- Fix #1: Rename 'title' column to 'name' to match TypeScript types
ALTER TABLE parties RENAME COLUMN title TO name;

-- Fix #2: Rename 'location' column to 'location_name' to match TypeScript types
ALTER TABLE parties RENAME COLUMN location TO location_name;

-- Fix #3: Add missing 'location_address' column
ALTER TABLE parties ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Fix #4: Update status constraint to include 'happening' instead of 'live'
ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_status_check;
ALTER TABLE parties ADD CONSTRAINT parties_status_check
  CHECK (status IN ('upcoming', 'happening', 'ended'));

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the fixes worked correctly
-- ============================================================================

-- Verify column names are correct
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'parties'
  AND column_name IN ('name', 'location_name', 'location_address')
ORDER BY ordinal_position;

-- Verify constraint is correct
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'parties_status_check';

-- Test query to ensure everything works
SELECT
  id,
  name,
  location_name,
  location_address,
  status,
  created_at
FROM parties
LIMIT 5;

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this script:
-- 1. Remove field mapping workarounds from src/stores/partyStore.ts (lines 71-75, 108-112, 137-141, 184-188)
-- 2. Test party creation and retrieval
-- 3. Verify all party data displays correctly in the app
-- ============================================================================
