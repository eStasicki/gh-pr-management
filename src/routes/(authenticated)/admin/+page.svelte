<script lang="ts">
  import { onMount } from "svelte";
  import { admin, checkAdminStatus } from "$lib/stores";
  import AdminPanel from "$lib/components/AdminPanel.svelte";
  import { browser } from "$app/environment";

  let isCheckingAdmin = true;

  onMount(async () => {
    if (browser) {
      await checkAdminStatus();
      isCheckingAdmin = false;
    }
  });
</script>

<svelte:head>
  <title>Panel Administratora - GitHub PR Management</title>
</svelte:head>

{#if isCheckingAdmin}
  <div class="bg-white rounded-2xl p-8 shadow-2xl">
    <div class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <svg
          class="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
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
        <p class="text-gray-600">Sprawdzanie uprawnień administratora...</p>
      </div>
    </div>
  </div>
{:else if $admin.isAdmin}
  <AdminPanel />
{:else}
  <div class="bg-white rounded-2xl p-8 shadow-2xl text-center">
    <div class="mb-6">
      <svg
        class="w-16 h-16 text-red-500 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
        ></path>
      </svg>
      <h1 class="text-2xl font-bold text-gray-800 mb-2">Brak uprawnień</h1>
      <p class="text-gray-600 mb-6">
        Nie masz uprawnień administratora do przeglądania tej strony.
      </p>
      <a
        href="/dashboard"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700"
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
        Wróć do Dashboard
      </a>
    </div>
  </div>
{/if}
