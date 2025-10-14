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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_roles_and_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_delete_users(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_ban_users(UUID[], TIMESTAMP, TEXT) TO authenticated;
