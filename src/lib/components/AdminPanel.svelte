<script lang="ts">
  import { onMount } from "svelte";
  import {
    adminService,
    type UserWithBanStatus,
  } from "$lib/services/adminService";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import ApiStatus from "./ApiStatus.svelte";
  import BanUserModal from "./modal/internal/modals/banUserModal.svelte";
  import DeleteUserModal from "./modal/internal/modals/deleteUserModal.svelte";

  let t = translations.pl;
  let usersWithBanStatus: UserWithBanStatus[] = [];
  let usersWithRoles: Array<{
    id: string;
    email: string;
    created_at: string;
    role: "user" | "admin" | null;
  }> = [];
  let isLoading = false;
  let errorMessage = "";
  let successMessage = "";
  let activeTab = "users";
  let banModalOpen = false;
  let deleteModalOpen = false;
  let selectedUser: { id: string; email: string } | null = null;
  let selectedUserForDelete: { id: string; email: string } | null = null;
  let openDropdownId: string | null = null;

  // Pagination
  const PER_PAGE = 10;
  let currentPage = 1;
  let displayedUsers: UserWithBanStatus[] = [];
  let totalUsers = 0;
  let totalPages = 0;

  // Simple pagination function
  function paginate(
    items: UserWithBanStatus[],
    pageSize: number,
    currentPage: number
  ): UserWithBanStatus[] {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }

  // Pagination component
  // Removed getTotalPages - replaced with totalPages from server-side pagination

  function getPageNumbers(
    currentPage: number,
    totalPages: number
  ): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 4) {
        start = 2;
        end = Math.min(5, totalPages - 1);
      } else if (currentPage >= totalPages - 3) {
        start = Math.max(2, totalPages - 4);
        end = totalPages - 1;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push("...");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }

  $: if (browser) {
    t = translations[$language];
  }

  onMount(() => {
    loadUsersWithRoles();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        closeDropdown();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });

  // Typ paginacji - 'server' dla server-side, 'client' dla client-side
  let paginationType: "server" | "client" = "client";

  async function loadUsersWithRoles() {
    isLoading = true;
    errorMessage = "";

    try {
      // Try server-side pagination
      const result = await adminService.getUsersWithBanStatusPaginated(
        currentPage,
        PER_PAGE
      );

      if (result.users.length > 0) {
        // Server-side pagination works
        displayedUsers = result.users;
        totalUsers = result.totalCount;
        totalPages = result.totalPages;
        paginationType = "server";
      } else {
        // Server-side doesn't work, use client-side
        console.warn("Server-side pagination not available, using client-side");
        await loadUsersWithRolesFallback();
        paginationType = "client";
      }
    } catch (error) {
      // Server-side doesn't work, use client-side
      console.warn("Server-side pagination failed, using client-side:", error);
      await loadUsersWithRolesFallback();
      paginationType = "client";
    } finally {
      isLoading = false;
    }
  }

  async function loadUsersWithRolesFallback() {
    try {
      usersWithRoles = await adminService.getUsersWithRoles();
      // Tymczasowo konwertuj na format z banami (bez informacji o banach)
      usersWithBanStatus = usersWithRoles.map((user) => ({
        ...user,
        is_banned: false,
        ban_info: null,
      }));

      // Set pagination
      totalUsers = usersWithBanStatus.length;
      totalPages = Math.ceil(totalUsers / PER_PAGE);

      // Check if currentPage doesn't exceed totalPages
      if (currentPage > totalPages) {
        currentPage = 1;
      }

      updateDisplayedUsers();
    } catch (error) {
      errorMessage = "Błąd podczas ładowania użytkowników";
    }
  }

  function updateDisplayedUsers() {
    displayedUsers = paginate(usersWithBanStatus, PER_PAGE, currentPage);
  }

  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;

      if (paginationType === "server") {
        // Server-side pagination - load new page from server
        loadUsersWithRoles();
      } else {
        // Client-side pagination - only update displayed data
        updateDisplayedUsers();
      }
    } else {
    }
  }

  function toggleDropdown(userId: string) {
    openDropdownId = openDropdownId === userId ? null : userId;
  }

  function closeDropdown() {
    openDropdownId = null;
  }

  function handleActionClick(action: () => void) {
    action();
    closeDropdown();
  }

  // Removed loadUsersWithBanStatus - replaced with loadUsersWithRoles with server-side pagination

  async function toggleUserRole(
    userId: string,
    currentRole: "user" | "admin" | null
  ) {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";

      // Check if trying to remove admin from app creator
      const user = usersWithBanStatus.find((u) => u.id === userId);
      if (newRole === "user" && user?.email === "estasicki@gmail.com") {
        errorMessage =
          "Nie można usunąć uprawnień administratora z twórcy aplikacji";
        setTimeout(() => {
          errorMessage = "";
        }, 3000);
        return;
      }

      await adminService.setUserRole(userId, newRole);

      // Refresh current page
      if (paginationType === "server") {
        await loadUsersWithRoles();
      } else {
        await loadUsersWithRolesFallback();
        updateDisplayedUsers();
      }

      successMessage = `Rola użytkownika została zmieniona na ${newRole}`;
      setTimeout(() => {
        successMessage = "";
      }, 3000);
    } catch (error) {
      errorMessage = "Błąd podczas zmiany roli użytkownika";
      console.error("Role toggle error:", error);
    }
  }

  function openBanModal(user: { id: string; email: string }) {
    selectedUser = user;
    banModalOpen = true;
  }

  function closeBanModal() {
    banModalOpen = false;
    selectedUser = null;
  }

  function openDeleteModal(user: { id: string; email: string }) {
    selectedUserForDelete = user;
    deleteModalOpen = true;
  }

  function closeDeleteModal() {
    deleteModalOpen = false;
    selectedUserForDelete = null;
  }

  async function handleBanUser(
    userId: string,
    expiresAt: string | null,
    reason?: string
  ) {
    try {
      await adminService.banUser(userId, expiresAt, reason);
      // Refresh current page
      if (paginationType === "server") {
        await loadUsersWithRoles();
      } else {
        await loadUsersWithRolesFallback();
        updateDisplayedUsers();
      }
      successMessage = t.ban_success;
      setTimeout(() => {
        successMessage = "";
      }, 3000);

      // Close modal after setting success message
      closeBanModal();
    } catch (error) {
      errorMessage = t.ban_error;
      console.error("Ban error:", error);
    }
  }

  async function handleUnbanUser(userId: string) {
    if (!confirm(t.unban_user_confirm)) {
      return;
    }

    try {
      await adminService.unbanUser(userId);
      // Refresh current page
      if (paginationType === "server") {
        await loadUsersWithRoles();
      } else {
        await loadUsersWithRolesFallback();
        updateDisplayedUsers();
      }
      successMessage = t.unban_success;
      setTimeout(() => {
        successMessage = "";
      }, 3000);
    } catch (error) {
      errorMessage = t.unban_error;
      console.error("Unban error:", error);
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      await adminService.deleteUser(userId);

      // Refresh current page
      if (paginationType === "server") {
        await loadUsersWithRoles();
      } else {
        await loadUsersWithRolesFallback();
        updateDisplayedUsers();
      }

      successMessage = t.delete_success;
      setTimeout(() => {
        successMessage = "";
      }, 3000);

      closeDeleteModal();
    } catch (error) {
      errorMessage = t.delete_error;
      console.error("Delete user error:", error);
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

  function setActiveTab(tab: string) {
    activeTab = tab;
  }
</script>

<div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
  <h2 class="text-2xl font-bold text-gray-800 mb-6">Panel Administratora</h2>

  <!-- Responsive Tab Layout -->
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- Tab Navigation -->
    <!-- Mobile: Horizontal with scroll -->
    <div class="lg:hidden">
      <nav class="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
        <button
          on:click={() => setActiveTab("users")}
          class="flex-shrink-0 flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap {activeTab ===
          'users'
            ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {t.user_management}
        </button>
        <button
          on:click={() => setActiveTab("api")}
          class="flex-shrink-0 flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap {activeTab ===
          'api'
            ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
        >
          <svg
            class="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          API
        </button>
      </nav>
    </div>

    <!-- Desktop: Vertical sidebar -->
    <div class="hidden lg:block w-64 flex-shrink-0">
      <nav class="space-y-1">
        <button
          on:click={() => setActiveTab("users")}
          class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 {activeTab ===
          'users'
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
        >
          <svg
            class="w-5 h-5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {t.user_management}
        </button>
        <button
          on:click={() => setActiveTab("api")}
          class="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 {activeTab ===
          'api'
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
        >
          <svg
            class="w-5 h-5 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Monitoring API
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 min-w-0">
      {#if activeTab === "users"}
        <!-- Users Management Tab -->
        {#if errorMessage}
          <div
            class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6"
          >
            {errorMessage}
          </div>
        {/if}

        {#if successMessage}
          <div
            class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-6 flex items-center"
          >
            <svg
              class="w-5 h-5 text-green-600 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span class="font-medium">{successMessage}</span>
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
            <span class="ml-3 text-gray-600">{t.loading_users}</span>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full table-auto">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-semibold text-gray-700"
                    >{t.user_email}</th
                  >
                  <th class="text-left py-3 px-4 font-semibold text-gray-700"
                    >{t.joined_at}</th
                  >
                  <th class="text-left py-3 px-4 font-semibold text-gray-700"
                    >{t.user_role}</th
                  >
                  <th class="text-left py-3 px-4 font-semibold text-gray-700"
                    >{t.user_status}</th
                  >
                  <th class="text-left py-3 px-4 font-semibold text-gray-700"
                    >{t.user_actions}</th
                  >
                </tr>
              </thead>
              <tbody>
                {#each displayedUsers as user}
                  <tr
                    class="border-b border-gray-100 hover:bg-gray-50 {user.is_banned
                      ? 'bg-red-50'
                      : ''}"
                  >
                    <td class="py-3 px-4 text-gray-800 flex items-center">
                      {#if user.is_banned}
                        <svg
                          class="w-4 h-4 text-red-600 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      {/if}
                      {user.email}
                    </td>
                    <td class="py-3 px-4 text-gray-600">
                      {#if user.is_banned && user.ban_info}
                        <div class="text-sm">
                          <div class="text-red-600 font-medium">Zbanowany:</div>
                          <div>{formatDate(user.ban_info.banned_at)}</div>
                        </div>
                      {:else}
                        <div class="text-sm">
                          <div class="text-gray-500">Utworzony:</div>
                          <div>{formatDate(user.created_at)}</div>
                        </div>
                      {/if}
                    </td>
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
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user.is_banned
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'}"
                      >
                        {user.is_banned ? t.banned : t.active}
                      </span>
                      {#if user.is_banned && user.ban_info}
                        <div class="text-xs text-gray-500 mt-1">
                          {#if user.ban_info.ban_expires_at}
                            {t.expires_at}: {formatDate(
                              user.ban_info.ban_expires_at
                            )}
                          {:else}
                            {t.permanent}
                          {/if}
                        </div>
                        {#if user.ban_info.reason}
                          <div class="text-xs text-gray-500 mt-1">
                            {t.ban_reason_text}: {user.ban_info.reason}
                          </div>
                        {/if}
                      {/if}
                    </td>
                    <td class="py-3 px-4">
                      {#if user.email !== "estasicki@gmail.com"}
                        <div class="relative dropdown-container">
                          <button
                            on:click={() => toggleDropdown(user.id)}
                            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <span>Akcje</span>
                            <svg
                              class="w-4 h-4 transition-transform {openDropdownId ===
                              user.id
                                ? 'rotate-180'
                                : ''}"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>

                          {#if openDropdownId === user.id}
                            <div
                              class="absolute right-0 z-10 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg"
                            >
                              <div class="py-1">
                                <!-- Role toggle -->
                                <button
                                  on:click={() =>
                                    handleActionClick(() =>
                                      toggleUserRole(user.id, user.role)
                                    )}
                                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <svg
                                    class="w-4 h-4 mr-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                  {user.role === "admin"
                                    ? "Usuń admina"
                                    : "Ustaw admina"}
                                </button>

                                <!-- Ban/Unban actions -->
                                {#if user.is_banned}
                                  <button
                                    on:click={() =>
                                      handleActionClick(() =>
                                        handleUnbanUser(user.id)
                                      )}
                                    class="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                  >
                                    <svg
                                      class="w-4 h-4 mr-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    {t.unban_user}
                                  </button>
                                {:else}
                                  <button
                                    on:click={() =>
                                      handleActionClick(() =>
                                        openBanModal({
                                          id: user.id,
                                          email: user.email,
                                        })
                                      )}
                                    class="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  >
                                    <svg
                                      class="w-4 h-4 mr-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                      />
                                    </svg>
                                    {t.ban_user}
                                  </button>
                                {/if}

                                <!-- Delete user action -->
                                <button
                                  on:click={() =>
                                    handleActionClick(() =>
                                      openDeleteModal({
                                        id: user.id,
                                        email: user.email,
                                      })
                                    )}
                                  class="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  <svg
                                    class="w-4 h-4 mr-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  {t.delete_user}
                                </button>
                              </div>
                            </div>
                          {/if}
                        </div>
                      {:else}
                        <span class="text-gray-400">⭐</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          {#if displayedUsers.length === 0}
            <div class="text-center py-8 text-gray-500">
              Brak użytkowników do wyświetlenia
            </div>
          {/if}
        {/if}

        <!-- Pagination -->
        {#if totalPages > 1}
          <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex flex-1 justify-between sm:hidden">
                <button
                  on:click={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                  class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.previous}
                </button>
                <button
                  on:click={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                  class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.next}
                </button>
              </div>
              <div
                class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between"
              >
                <div>
                  <p class="text-sm text-gray-700">
                    {t.showing}
                    <span class="font-medium"
                      >{(currentPage - 1) * PER_PAGE + 1}</span
                    >
                    {t.to}
                    <span class="font-medium"
                      >{Math.min(currentPage * PER_PAGE, totalUsers)}</span
                    >
                    {t.of}
                    <span class="font-medium">{totalUsers}</span>
                    {t.results}
                  </p>
                </div>
                <div>
                  <nav
                    class="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    <button
                      on:click={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || isLoading}
                      class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span class="sr-only">{t.previous}</span>
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>

                    {#each getPageNumbers(currentPage, totalPages) as page}
                      {#if typeof page === "number"}
                        <button
                          on:click={() => handlePageChange(page)}
                          disabled={isLoading}
                          class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed {page ===
                          currentPage
                            ? 'bg-blue-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900'}"
                        >
                          {page}
                        </button>
                      {:else}
                        <span
                          class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                        >
                          ...
                        </span>
                      {/if}
                    {/each}

                    <button
                      on:click={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || isLoading}
                      class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span class="sr-only">{t.next}</span>
                      <svg
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <div class="mt-6 pt-6 border-t border-gray-200">
          <button
            on:click={loadUsersWithRoles}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700"
          >
            {t.refresh_users}
          </button>
        </div>
      {:else if activeTab === "api"}
        <!-- API Monitoring Tab -->
        <ApiStatus />
      {/if}
    </div>
  </div>
</div>

{#if selectedUser}
  <BanUserModal
    bind:isOpen={banModalOpen}
    userEmail={selectedUser.email}
    userId={selectedUser.id}
    onBan={handleBanUser}
    onClose={closeBanModal}
  />
{/if}

{#if selectedUserForDelete}
  <DeleteUserModal
    bind:isOpen={deleteModalOpen}
    userEmail={selectedUserForDelete.email}
    userId={selectedUserForDelete.id}
    on:delete={(event) => handleDeleteUser(event.detail.userId)}
    on:close={closeDeleteModal}
  />
{/if}
