<script lang="ts">
  import "../../app.css";
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
  import Navigation from "$lib/components/Navigation.svelte";
  import MobileNavigationModal from "$lib/components/modals/MobileNavigationModal.svelte";
  import ConnectionLostModal from "$lib/components/modals/ConnectionLostModal.svelte";
  import { auth } from "$lib/stores";
  import { initializeAuth } from "$lib/stores/supabaseAuth";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  let isMobileMenuOpen = false;
  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  onMount(() => {
    initializeAuth();
  });

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMobileMenu() {
    isMobileMenuOpen = false;
  }
</script>

<div
  class="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800"
>
  <div class="max-w-6xl mx-auto p-5">
    <header
      class="bg-white rounded-2xl p-6 mb-6 shadow-2xl flex justify-between items-center"
    >
      <h1 class="text-3xl font-bold text-gray-800">
        <a href="/">GitHub PR Management</a>
      </h1>

      <div class="hidden lg:flex gap-4 items-center">
        <Navigation />
      </div>

      <button
        on:click={toggleMobileMenu}
        class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        aria-label={t.menu_toggle}
      >
        <svg
          class="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </header>

    <main>
      <slot />
    </main>
    <div class="flex justify-end">
      <LanguageSwitcher />
    </div>
  </div>
</div>

<MobileNavigationModal
  bind:isOpen={isMobileMenuOpen}
  onClose={closeMobileMenu}
/>
<ConnectionLostModal bind:isOpen={$auth.showConnectionLostModal} />
