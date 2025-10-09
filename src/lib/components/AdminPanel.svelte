<script lang="ts">
  import { onMount } from "svelte";
  import { adminService } from "$lib/services/adminService";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";

  let t = translations.pl;
  let usersWithRoles: Array<{
    id: string;
    email: string;
    created_at: string;
    role: "user" | "admin" | null;
  }> = [];
  let isLoading = false;
  let errorMessage = "";
  let successMessage = "";

  $: if (browser) {
    t = translations[$language];
  }

  onMount(() => {
    loadUsersWithRoles();
  });

  async function loadUsersWithRoles() {
    isLoading = true;
    errorMessage = "";

    try {
      usersWithRoles = await adminService.getUsersWithRoles();
    } catch (error) {
      console.error("Error loading users:", error);
      errorMessage = "Błąd podczas ładowania użytkowników";
    } finally {
      isLoading = false;
    }
  }

  async function toggleUserRole(
    userId: string,
    currentRole: "user" | "admin" | null
  ) {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      await adminService.setUserRole(userId, newRole);

      // Odśwież listę
      await loadUsersWithRoles();

      successMessage = `Rola użytkownika została zmieniona na ${newRole}`;
      setTimeout(() => {
        successMessage = "";
      }, 3000);
    } catch (error) {
      console.error("Error changing user role:", error);
      errorMessage = "Błąd podczas zmiany roli użytkownika";
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
  <h2 class="text-2xl font-bold text-gray-800 mb-6">
    Zarządzanie administratorami
  </h2>

  {#if errorMessage}
    <div
      class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6"
    >
      {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div
      class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-6"
    >
      {successMessage}
    </div>
  {/if}

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <svg
        class="animate-spin h-8 w-8 text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span class="ml-3 text-gray-600">Ładowanie użytkowników...</span>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full table-auto">
        <thead>
          <tr class="border-b border-gray-200">
            <th class="text-left py-3 px-4 font-semibold text-gray-700"
              >Email</th
            >
            <th class="text-left py-3 px-4 font-semibold text-gray-700"
              >Data dodania roli</th
            >
            <th class="text-left py-3 px-4 font-semibold text-gray-700">Rola</th
            >
            <th class="text-left py-3 px-4 font-semibold text-gray-700"
              >Akcje</th
            >
          </tr>
        </thead>
        <tbody>
          {#each usersWithRoles as user}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 px-4 text-gray-800">{user.email}</td>
              <td class="py-3 px-4 text-gray-600"
                >{formatDate(user.created_at)}</td
              >
              <td class="py-3 px-4">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user.role ===
                  'admin'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'}"
                >
                  {user.role === "admin" ? "Administrator" : "Użytkownik"}
                </span>
              </td>
              <td class="py-3 px-4">
                <button
                  on:click={() => toggleUserRole(user.id, user.role)}
                  class="px-3 py-1 text-sm font-medium rounded-md transition-colors {user.role ===
                  'admin'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'}"
                >
                  {user.role === "admin" ? "Usuń admina" : "Ustaw admina"}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if usersWithRoles.length === 0}
      <div class="text-center py-8 text-gray-500">
        Brak użytkowników do wyświetlenia
      </div>
    {/if}
  {/if}

  <div class="mt-6 pt-6 border-t border-gray-200">
    <button
      on:click={loadUsersWithRoles}
      class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700"
    >
      Odśwież listę
    </button>
  </div>
</div>
