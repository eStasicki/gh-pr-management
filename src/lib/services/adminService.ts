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
      // Check if trying to remove admin from app creator
      if (role === "user") {
        const { data: userData } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", userId)
          .single();

        if (userData?.email === "estasicki@gmail.com") {
          throw new Error(
            "Nie można usunąć uprawnień administratora z twórcy aplikacji"
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
        data?.map((item) => ({
          id: item.id,
          email: item.email || "Brak email",
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
        console.warn("is_user_banned RPC not available:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.warn("is_user_banned RPC not available:", error);
      return false;
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
        "Funkcja banowania nie jest jeszcze dostępna. Uruchom skrypt SQL w Supabase."
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
        "Funkcja odbanowania nie jest jeszcze dostępna. Uruchom skrypt SQL w Supabase."
      );
    }
  },

  // Get users with ban information (with pagination)
  async getUsersWithBanStatusPaginated(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{
    users: UserWithBanStatus[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      const { data, error } = await supabase.rpc(
        "get_users_with_ban_status_paginated",
        {
          page_number: page,
          page_size: pageSize,
        }
      );

      if (error) {
        throw error;
      }

      const users =
        data?.users?.map((item: any) => ({
          id: item.id,
          email: item.email || "Brak email",
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
      console.warn(
        "get_users_with_ban_status_paginated RPC not available:",
        error
      );
      throw error;
    }
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
        throw new Error(data.error || "Błąd podczas usuwania użytkownika");
      }
    } catch (error) {
      console.error("delete_user_account RPC error:", error);
      throw new Error(
        "Błąd podczas usuwania użytkownika. Sprawdź czy funkcja SQL została dodana w Supabase."
      );
    }
  },
};
