-- Create projects table for multi-project support
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  github_token TEXT,
  repo_owner TEXT,
  repo_name TEXT,
  enterprise_url TEXT,
  requires_vpn BOOLEAN DEFAULT false,
  demo_mode BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_projects_user_active ON projects(user_id) WHERE is_active = true;

-- Add unique constraint: only one active project per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_one_active 
  ON projects(user_id) 
  WHERE is_active = true;

-- Add unique constraint: project names must be unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_name_unique 
  ON projects(user_id, project_name);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own projects
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projects
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own projects
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on project updates
DROP TRIGGER IF EXISTS trigger_update_projects_updated_at ON projects;
CREATE TRIGGER trigger_update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Function to ensure only one active project per user
CREATE OR REPLACE FUNCTION ensure_one_active_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Deactivate all other projects for this user
    UPDATE projects 
    SET is_active = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active project
DROP TRIGGER IF EXISTS trigger_ensure_one_active_project ON projects;
CREATE TRIGGER trigger_ensure_one_active_project
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_one_active_project();

