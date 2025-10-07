<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let isOpen = false;
  export let title = "";
  export let maxWidth = "max-w-lg";

  const dispatch = createEventDispatcher();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      closeModal();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function closeModal() {
    dispatch("close");
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-[#00000090] flex items-center justify-center z-50"
    on:keydown={handleKeydown}
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="bg-white rounded-lg p-6 w-full {maxWidth} mx-4 relative">
      <button
        on:click={closeModal}
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        aria-label="Close modal"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>

      <h3 class="text-xl font-bold text-gray-800 mb-4 pr-8">
        {title}
      </h3>

      <slot />
    </div>
  </div>
{/if}
