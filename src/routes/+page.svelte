<script lang="ts">
  import { onMount } from "svelte";
  import { config } from "$lib/stores";
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

  // Check if config is complete (only in browser)
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