<script lang="ts">
  import "../../app.css";
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
  import Navigation from "$lib/components/Navigation.svelte";
  import ConnectionLostModal from "$lib/components/modals/ConnectionLostModal.svelte";
  import { auth } from "$lib/stores";
  import { initializeAuth } from "$lib/stores/supabaseAuth";
  import { onMount } from "svelte";

  onMount(() => {
    initializeAuth();
  });
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
        <Navigation />
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
