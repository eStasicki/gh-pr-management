<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";

  const dispatch = createEventDispatcher();

  let t = translations.pl;

  $: if (typeof window !== "undefined") {
    t = translations[$language];
  }

  function handleClick() {
    dispatch("refresh");
  }
</script>

<button
  on:click={handleClick}
  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    ></path>
  </svg>
  {t.refresh}
</button>
