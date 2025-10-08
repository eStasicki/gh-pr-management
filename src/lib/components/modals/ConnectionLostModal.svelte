<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { auth } from "$lib/stores";
  import Modal from "../Modal.svelte";

  export let isOpen = false;

  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  function handleRetry() {
    auth.update((state) => ({
      ...state,
      connectionError: null,
    }));
    isOpen = false;
  }

  function handleModalClose() {
    isOpen = false;
  }
</script>

<Modal
  bind:isOpen
  title={t.connection_lost_title}
  maxWidth="max-w-md"
  on:close={handleModalClose}
>
  <div class="mb-6">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg
          class="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <div class="ml-3">
        <p class="text-sm text-gray-700 leading-relaxed">
          {t.connection_lost_message}
        </p>
      </div>
    </div>
  </div>

  <div class="flex gap-3 justify-end">
    <button
      on:click={handleRetry}
      class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
    >
      {t.retry_connection}
    </button>
  </div>
</Modal>
