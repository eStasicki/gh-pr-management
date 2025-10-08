<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { selectedPRs } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";

  const dispatch = createEventDispatcher();

  let t = translations.pl;

  $: if (typeof window !== "undefined") {
    t = translations[$language];
  }

  function handleAddLabels() {
    dispatch("addLabels");
  }
</script>

{#if $selectedPRs.length > 0}
  <button
    on:click={handleAddLabels}
    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
  >
    <svg
      class="w-4 h-4 shrink-0 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      ></path>
    </svg>
    {t.add_labels} ({$selectedPRs.length})
  </button>
{/if}
