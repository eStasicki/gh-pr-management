import { supabase } from "$lib/supabaseClient";

export interface UserRole {
  id: string;
  user_id: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface BannedUser {
  id: string;
  user_id: string;
  banned_by: string;
  banned_at: string;
  ban_expires_at: string | null;
  reason: string | null;
}

export interface UserWithBanStatus {
  id: string;
  email: string;
  created_at: string;
  role: "user" | "admin" | null;
  is_banned: boolean;
  ban_info: BannedUser | null;
}

export const adminService = {
  // Check if current user is administrator
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("is_admin");

      if (error) {
        return false;
      }

      return data === true;
    } catch (error) {
      return false;
    }
  },

  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("is_admin", {
        user_uuid: userId,
      });

      if (error) {
        return false;
      }

      return data === true;
    } catch (error) {
      return false;
    }
  },

  // Get all user roles (admin only)
  async getAllUserRoles(): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // Set user role (admin only)
  async setUserRole(userId: string, role: "user" | "admin"): Promise<void> {
    try {
      // Check if trying to remove admin privileges from app creator
      if (role === "user") {
        const { data: userData } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", userId)
          .single();

        if (userData?.email === "estasicki@gmail.com") {
          throw new Error(
            "Cannot remove admin privileges from the application creator"
          );
        }
      }

      const { error } = await supabase.from("user_roles").upsert({
        user_id: userId,
        role: role,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  // Remove user role (admin only)
  async removeUserRole(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  // Get user information with their roles
  async getUsersWithRoles(): Promise<
    Array<{
      id: string;
      email: string;
      created_at: string;
      role: "user" | "admin" | null;
    }>
  > {
    try {
      // Use SQL function to get users with roles and emails
      const { data, error } = await supabase.rpc(
        "get_users_with_roles_and_emails"
      );

      if (error) {
        throw error;
      }

      return (
        data?.map((item: any) => ({
          id: item.id,
          email: item.email || "No email",
          created_at: item.created_at,
          role: item.role,
        })) || []
      );
    } catch (error) {
      throw error;
    }
  },

  // Check if user is banned
  async isUserBanned(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("is_user_banned", {
        user_uuid: userId,
      });

      if (error) {
        return false;
      }

      return data === true;
    } catch (error) {
      return false;
    }
  },

  // Get ban info for a user
  async getUserBanInfo(userId: string): Promise<{
    id: string;
    user_id: string;
    banned_by: string;
    banned_at: string;
    ban_expires_at: string | null;
    reason: string;
  } | null> {
    try {
      const { data, error } = await supabase.rpc("get_user_ban_info", {
        user_uuid: userId,
      });

      if (error) {
        return null;
      }

      if (data && data.length > 0) {
        return {
          id: data[0].id,
          user_id: data[0].user_id,
          banned_by: data[0].banned_by,
          banned_at: data[0].banned_at,
          ban_expires_at: data[0].ban_expires_at,
          reason: data[0].reason,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  },

  // Ban user
  async banUser(
    userId: string,
    expiresAt: string | null,
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc("ban_user", {
        target_user_id: userId,
        expires_at: expiresAt,
        ban_reason: reason || null,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("ban_user RPC not available:", error);
      throw new Error(
        "Banning function is not yet available. Run the SQL script in Supabase."
      );
    }
  },

  // Unban user
  async unbanUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("unban_user", {
        target_user_id: userId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("unban_user RPC not available:", error);
      throw new Error(
        "Unbanning function is not yet available. Run the SQL script in Supabase."
      );
    }
  },

  // Test function to check if we have users
  async testGetUsers(): Promise<{
    userCount: number;
    sampleUsers: any[];
  }> {
    try {
      const { data, error } = await supabase.rpc("test_get_users");

      if (error) {
        throw error;
      }

      return {
        userCount: data?.user_count || 0,
        sampleUsers: data?.sample_users || [],
      };
    } catch (error) {
      console.error("test_get_users RPC error:", error);
      throw error;
    }
  },

  // Universal function to get users with filtering and pagination
  async getAllUsers(
    filterType: "all" | "banned" | "admin" | "active" = "all",
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    users: UserWithBanStatus[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      const { data, error } = await supabase.rpc("get_all_users", {
        filter_type: filterType,
        page_number: page,
        page_size: pageSize,
      });

      if (error) {
        throw error;
      }

      const users =
        data?.users?.map((item: any) => ({
          id: item.id,
          email: item.email || "No email",
          created_at: item.created_at,
          role: item.role,
          is_banned: item.is_banned || false,
          ban_info: item.ban_info
            ? {
                id: item.ban_info.id,
                user_id: item.ban_info.user_id,
                banned_by: item.ban_info.banned_by,
                banned_at: item.ban_info.banned_at,
                ban_expires_at: item.ban_info.ban_expires_at,
                reason: item.ban_info.reason,
              }
            : null,
        })) || [];

      return {
        users,
        totalCount: data?.total_count || 0,
        totalPages: Math.ceil((data?.total_count || 0) / pageSize),
      };
    } catch (error) {
      console.warn("get_all_users RPC not available:", error);
      throw error;
    }
  },

  // Legacy function for backward compatibility
  async getUsersWithBanStatusPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    users: UserWithBanStatus[];
    totalCount: number;
    totalPages: number;
  }> {
    return this.getAllUsers("all", page, pageSize);
  },

  // Delete user account (admin only)
  async deleteUser(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase.rpc("delete_user_account", {
        target_user_id: userId,
      });

      if (error) {
        throw error;
      }

      // Check if the operation was successful
      if (data && !data.success) {
        throw new Error(data.error || "Error while deleting user");
      }
    } catch (error) {
      console.error("delete_user_account RPC error:", error);
      throw new Error(
        "Error while deleting user. Check if the SQL function has been added to Supabase."
      );
    }
  },

  // Bulk delete users (admin only)
  async bulkDeleteUsers(userIds: string[]): Promise<{ deletedCount: number }> {
    try {
      // Filter out creator email from the list
      const filteredUserIds = userIds.filter(
        (id) => id !== "estasicki@gmail.com"
      );

      if (filteredUserIds.length === 0) {
        throw new Error("Cannot modify the creator account");
      }

      const { data, error } = await supabase.rpc("bulk_delete_users", {
        target_user_ids: filteredUserIds,
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Error during bulk user deletion");
      }

      return { deletedCount: data.deleted_count || 0 };
    } catch (error) {
      console.error("bulk_delete_users RPC error:", error);
      throw new Error(
        "Error during bulk user deletion. Check if the SQL function has been added to Supabase."
      );
    }
  },

  // Bulk ban users (admin only)
  async bulkBanUsers(
    userIds: string[],
    expiresAt: string | null,
    reason?: string
  ): Promise<{ bannedCount: number }> {
    try {
      // Filter out creator email from the list
      const filteredUserIds = userIds.filter(
        (id) => id !== "estasicki@gmail.com"
      );

      if (filteredUserIds.length === 0) {
        throw new Error("Cannot modify the creator account");
      }

      const { data, error } = await supabase.rpc("bulk_ban_users", {
        target_user_ids: filteredUserIds,
        expires_at: expiresAt,
        ban_reason: reason || null,
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Error during bulk user banning");
      }

      return { bannedCount: data.banned_count || 0 };
    } catch (error) {
      console.error("bulk_ban_users RPC error:", error);
      throw new Error(
        "Error during bulk user banning. Check if the SQL function has been added to Supabase."
      );
    }
  },
};
