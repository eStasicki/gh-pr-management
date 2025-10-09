<script lang="ts">
  import "../../app.css";
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
  import { page } from "$app/stores";
  import UserAccount from "$lib/components/UserAccount.svelte";
  import ConnectionLostModal from "$lib/components/modals/ConnectionLostModal.svelte";
  import { auth } from "$lib/stores";
  import { initializeAuth } from "$lib/stores/supabaseAuth";
  import { supabaseAuth, signOut } from "$lib/stores/supabaseAuth";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";

  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  onMount(() => {
    initializeAuth();
  });

  const handleSignOut = async () => {
    await signOut();
    goto("/login");
  };
</script>

<div
  class="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800"
>
  <div class="max-w-6xl mx-auto p-5">
    <header
      class="bg-white rounded-2xl p-6 mb-6 shadow-2xl flex justify-between items-center"
    >
      <h1 class="text-3xl font-bold text-gray-800">GitHub PR Management</h1>
      <div class="flex gap-4 items-center">
        <nav class="flex gap-4">
          <a
            href="/dashboard"
            class="px-4 py-2 rounded-lg transition-colors duration-200 {$page
              .url.pathname === '/dashboard'
              ? 'bg-blue-100 text-blue-700 font-semibold'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}"
          >
            {t.dashboard_nav}
          </a>
          <a
            href="/settings"
            class="px-4 py-2 rounded-lg transition-colors duration-200 {$page
              .url.pathname === '/settings'
              ? 'bg-blue-100 text-blue-700 font-semibold'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}"
          >
            {t.settings_nav}
          </a>
        </nav>
        <button
          on:click={handleSignOut}
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition duration-200"
        >
          {t.sign_out}
        </button>
      </div>
    </header>

    <main>
      <slot />
    </main>
    <div class="flex justify-end">
      <LanguageSwitcher />
    </div>
  </div>
</div>

<ConnectionLostModal bind:isOpen={$auth.showConnectionLostModal} />
