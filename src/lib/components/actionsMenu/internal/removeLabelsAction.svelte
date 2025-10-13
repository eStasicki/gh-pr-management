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

  function handleRemoveLabels() {
    dispatch("removeLabels");
  }
</script>

{#if $selectedPRs.length > 0}
  <button
    on:click={handleRemoveLabels}
    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
  >
    <svg
      class="w-4 h-4 shrink-0 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      ></path>
    </svg>
    {t.remove_labels} ({$selectedPRs.length})
  </button>
{/if}
