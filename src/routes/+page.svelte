<script lang="ts">
  import { onMount } from "svelte";
  import { config, currentUser } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import ConfigForm from "$lib/components/ConfigForm.svelte";
  import MainSection from "$lib/components/MainSection.svelte";
  import { browser } from "$app/environment";
  import type { PageData } from "./$types";

  export let data: PageData;

  let showConfig = true;
  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  onMount(() => {
    // Load config from server data
    if (data.config.token && data.config.owner && data.config.repo) {
      console.log("Server config is complete:", data.config);
      config.set(data.config);
      showConfig = false;
    } else {
      console.log("Server config is incomplete:", data.config);
      showConfig = true;
    }
  });

  // Reactive statement to update showConfig when config changes (only in browser)
  $: if (browser) {
    if ($config.token && $config.owner && $config.repo) {
      showConfig = false;
    } else {
      showConfig = true;
    }
  }
</script>

<svelte:head>
  <title>GitHub PR Management</title>
</svelte:head>

{#if showConfig}
  <ConfigForm />
{:else}
  <MainSection />
{/if}
