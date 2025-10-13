<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";

  const dispatch = createEventDispatcher();

  let t = translations.pl;

  $: if (typeof window !== "undefined") {
    t = translations[$language];
  }

  export let allPRsSelected = false;

  function handleClick() {
    dispatch("selectAll");
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
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>
  </svg>
  {allPRsSelected ? t.deselect_all : t.select_all}
</button>
