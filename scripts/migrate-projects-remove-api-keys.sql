-- Migration: Remove API keys from projects table (move to localStorage)
-- These fields should be nullable since we're not storing actual values anymore

-- Step 1: Make API key fields nullable (they will contain empty strings or NULL)
ALTER TABLE projects 
  ALTER COLUMN github_token DROP NOT NULL,
  ALTER COLUMN repo_owner DROP NOT NULL,
  ALTER COLUMN repo_name DROP NOT NULL;

-- Step 2: IMPORTANT - Before running this, make sure you've migrated data to localStorage
-- The application will automatically migrate API keys from Supabase to localStorage
-- on first load via migrateFromSupabase() function.
-- After migration, you can safely clear the old data:

-- Clear existing API key values from Supabase (run this AFTER data migration to localStorage)
UPDATE projects 
SET 
  github_token = NULL, 
  repo_owner = NULL, 
  repo_name = NULL,
  enterprise_url = NULL
WHERE 
  github_token IS NOT NULL 
  OR repo_owner IS NOT NULL 
  OR repo_name IS NOT NULL;

