<script lang="ts">
  import { currentUser, config, selectedPRs, auth } from "$lib/stores";
  import { translations } from "$lib/translations";
  import { language } from "$lib/stores/language";
  import { browser } from "$app/environment";

  let t = translations.pl;
  let isDropdownOpen = false;

  $: if (browser) {
    t = translations[$language];
  }

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }

  function logout() {
    config.set({
      token: "",
      owner: "",
      repo: "",
      enterpriseUrl: "",
    });

    if (browser) {
      localStorage.removeItem("selectedPRs");
      selectedPRs.set([]);
    }
    isDropdownOpen = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".user-account-container")) {
      isDropdownOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

{#if $auth.isValidating}
  <div
    class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100"
  >
    <svg
      class="w-5 h-5 text-gray-400 animate-spin"
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
  </div>
{:else if $auth.isLoggedIn}
  <div class="relative user-account-container">
    <button
      on:click={toggleDropdown}
      aria-label={$currentUser?.name}
      class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
    >
      <svg
        class="w-6 h-6 text-gray-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    {#if isDropdownOpen}
      <div
        class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
      >
        <div class="px-4 py-3 border-b border-gray-100">
          <a
            href={$currentUser?.html_url}
            target="_blank"
            class="text-sm font-medium text-gray-900 hover:underline"
            >{$currentUser?.login}</a
          >
          {#if $currentUser?.name}
            <p class="text-sm text-gray-500">{$currentUser.name}</p>
          {/if}
        </div>
        <button
          on:click={logout}
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 cursor-pointer"
        >
          {t.logout}
        </button>
      </div>
    {/if}
  </div>
{/if}

{#if $auth.connectionError}
  <div
    class="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700"
  >
    <div class="flex items-center">
      <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      {$auth.connectionError}
    </div>
  </div>
{/if}
