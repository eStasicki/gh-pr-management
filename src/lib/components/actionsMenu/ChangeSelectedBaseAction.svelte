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

  function handleClick() {
    dispatch("changeSelectedBase");
  }
</script>

{#if $selectedPRs.length > 0}
  <button
    on:click={handleClick}
    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
  >
    <svg
      class="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      ></path>
    </svg>
    {t.change_selected_base} ({$selectedPRs.length})
  </button>
{/if}
