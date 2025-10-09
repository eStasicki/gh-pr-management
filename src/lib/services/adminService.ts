import { supabase } from "$lib/supabaseClient";

export interface UserRole {
  id: string;
  user_id: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export const adminService = {
  // Sprawdź czy aktualny użytkownik jest administratorem
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("is_admin");

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  },

  // Sprawdź czy konkretny użytkownik jest administratorem
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("is_admin", {
        user_uuid: userId,
      });

      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  },

  // Pobierz wszystkie role użytkowników (tylko dla adminów)
  async getAllUserRoles(): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user roles:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching user roles:", error);
      throw error;
    }
  },

  // Ustaw rolę użytkownika (tylko dla adminów)
  async setUserRole(userId: string, role: "user" | "admin"): Promise<void> {
    try {
      const { error } = await supabase.from("user_roles").upsert({
        user_id: userId,
        role: role,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error setting user role:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error setting user role:", error);
      throw error;
    }
  },

  // Usuń rolę użytkownika (tylko dla adminów)
  async removeUserRole(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("Error removing user role:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error removing user role:", error);
      throw error;
    }
  },

  // Pobierz informacje o użytkownikach z ich rolami
  async getUsersWithRoles(): Promise<
    Array<{
      id: string;
      email: string;
      created_at: string;
      role: "user" | "admin" | null;
    }>
  > {
    try {
      // Użyj funkcji SQL do pobrania użytkowników z rolami i emailami
      const { data, error } = await supabase.rpc(
        "get_users_with_roles_and_emails"
      );

      if (error) {
        console.error("Error fetching users with roles:", error);
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
      console.error("Error fetching users with roles:", error);
      throw error;
    }
  },
};
