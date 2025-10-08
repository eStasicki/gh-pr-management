<script lang="ts">
  import { onMount } from "svelte";
  import { config, auth } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import ConfigForm from "$lib/components/ConfigForm.svelte";
  import MainSection from "$lib/components/MainSection.svelte";
  import { browser } from "$app/environment";

  let showConfig = true;
  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  // Check if user is authenticated and config is complete (only in browser)
  $: if (browser) {
    const hasConfig = $config.token && $config.owner && $config.repo;
    const isAuthenticated = $auth.isLoggedIn && !$auth.isValidating;

    if (hasConfig && isAuthenticated) {
      showConfig = false;
    } else if (!hasConfig) {
      showConfig = true;
    }
    // If hasConfig but not authenticated, keep showing config until validation completes
  }
</script>

<svelte:head>
  <title>GitHub PR Management</title>
</svelte:head>

{#if showConfig}
  <ConfigForm />
{:else if $auth.isValidating}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div
        class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
      ></div>
      <p class="text-gray-600">Weryfikacja połączenia z GitHub...</p>
    </div>
  </div>
{:else}
  <MainSection />
{/if}
