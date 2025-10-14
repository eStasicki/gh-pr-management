-- Bulk operations for user management
-- These functions provide secure bulk delete and ban operations

-- Function to get users with roles and emails (fixes ambiguous column issue)
CREATE OR REPLACE FUNCTION get_users_with_roles_and_emails()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    COALESCE(ur.role::TEXT, 'user'::TEXT) as role
  FROM auth.users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_users_with_ban_status_paginated(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_all_users(TEXT, INTEGER, INTEGER);

-- Test function to check if we have users
CREATE OR REPLACE FUNCTION test_get_users()
RETURNS TABLE (
  user_count INTEGER,
  sample_users JSON
) AS $$
DECLARE
  total_count INTEGER;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM auth.users;
  
  -- Return sample users
  RETURN QUERY
  SELECT 
    total_count as user_count,
    COALESCE(
      json_agg(
        json_build_object(
          'id', u.id,
          'email', u.email,
          'created_at', u.created_at
        ) ORDER BY u.created_at DESC
      ),
      '[]'::json
    ) as sample_users
  FROM (
    SELECT u.id, u.email, u.created_at
    FROM auth.users u 
    ORDER BY u.created_at DESC
    LIMIT 5
  ) u;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple function to get all users with ban status and pagination
CREATE OR REPLACE FUNCTION get_all_users(
  filter_type TEXT DEFAULT 'all',
  page_number INTEGER DEFAULT 1,
  page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
  users JSON,
  total_count INTEGER
) AS $$
DECLARE
  offset_value INTEGER;
  total_users INTEGER;
BEGIN
  -- Calculate offset
  offset_value := (page_number - 1) * page_size;
  
  -- Get total count
  SELECT COUNT(*) INTO total_users FROM auth.users;
  
  -- Return all users with ban status and roles
  RETURN QUERY
  SELECT 
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', u.id,
            'email', u.email,
            'created_at', u.created_at,
            'role', COALESCE(ur.role, 'user'),
            'is_banned', CASE WHEN bu.user_id IS NOT NULL THEN true ELSE false END,
            'ban_info', CASE 
              WHEN bu.user_id IS NOT NULL THEN
                json_build_object(
                  'id', bu.id,
                  'user_id', bu.user_id,
                  'banned_by', bu.banned_by,
                  'banned_at', bu.banned_at,
                  'ban_expires_at', bu.ban_expires_at,
                  'reason', bu.reason
                )
              ELSE NULL
            END
          )
        )
        FROM (
          SELECT u.id, u.email, u.created_at
          FROM auth.users u 
          ORDER BY u.created_at DESC
          LIMIT page_size OFFSET offset_value
        ) u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN banned_users bu ON u.id = bu.user_id
      ),
      '[]'::json
    ) as users,
    total_users as total_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk delete users with validation
CREATE OR REPLACE FUNCTION bulk_delete_users(target_user_ids UUID[])
RETURNS JSON AS $$
DECLARE
  deleted_count INTEGER := 0;
  user_id UUID;
  user_email TEXT;
  creator_email TEXT := 'estasicki@gmail.com';
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;

  -- Process each user ID
  FOREACH user_id IN ARRAY target_user_ids
  LOOP
    -- Get user email for validation
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    -- Skip if user is the creator
    IF user_email = creator_email THEN
      CONTINUE;
    END IF;
    
    -- Call existing delete_user_account function
    PERFORM delete_user_account(user_id);
    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'message', 'Bulk delete operation completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk ban users with validation
CREATE OR REPLACE FUNCTION bulk_ban_users(
  target_user_ids UUID[],
  expires_at TIMESTAMP DEFAULT NULL,
  ban_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  banned_count INTEGER := 0;
  user_id UUID;
  user_email TEXT;
  creator_email TEXT := 'estasicki@gmail.com';
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;

  -- Process each user ID
  FOREACH user_id IN ARRAY target_user_ids
  LOOP
    -- Get user email for validation
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    -- Skip if user is the creator
    IF user_email = creator_email THEN
      CONTINUE;
    END IF;
    
    -- Call existing ban_user function
    PERFORM ban_user(user_id, expires_at, ban_reason);
    banned_count := banned_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'banned_count', banned_count,
    'message', 'Bulk ban operation completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM banned_users 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ban info for a user
CREATE OR REPLACE FUNCTION get_user_ban_info(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  banned_by TEXT,
  banned_at TIMESTAMP WITH TIME ZONE,
  ban_expires_at TIMESTAMP WITH TIME ZONE,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bu.id,
    bu.user_id,
    bu.banned_by,
    bu.banned_at,
    bu.ban_expires_at,
    bu.reason
  FROM banned_users bu
  WHERE bu.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_roles_and_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION test_get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_delete_users(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_ban_users(UUID[], TIMESTAMP, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_banned(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ban_info(UUID) TO authenticated;
