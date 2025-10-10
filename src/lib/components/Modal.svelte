<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";
  import { fade, fly, scale } from "svelte/transition";
  import { createBackdropClickHandler } from "$lib/utils/uiUtils";
  import { createEscapeKeyHandler } from "$lib/utils/keyboardUtils";

  export let isOpen = false;
  export let title = "";
  export let maxWidth = "max-w-lg";
  export let showDefaultFooter = false;
  export let cancelText = "Anuluj";
  export let confirmText = "Potwierdź";
  export let confirmDisabled = false;
  export let onCancel: (() => void) | undefined = undefined;
  export let onConfirm: (() => void) | undefined = undefined;

  const dispatch = createEventDispatcher();

  const escapeKeyHandler = createEscapeKeyHandler(() => {
    dispatch("close");
  });

  const backdropHandler = createBackdropClickHandler(() => {
    dispatch("close");
  });

  function closeModal() {
    dispatch("close");
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    } else {
      closeModal();
    }
  }

  function handleConfirm() {
    if (onConfirm) {
      onConfirm();
    } else {
      closeModal();
    }
  }

  // Block scroll when modal is open
  function blockScroll() {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  }

  function unblockScroll() {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  }

  // Reactive block to handle scroll blocking
  $: if (isOpen) {
    blockScroll();
  } else {
    unblockScroll();
  }

  // Cleanup on component destroy
  onDestroy(() => {
    unblockScroll();
  });
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-[#00000090] flex items-center justify-center z-50 backdrop-blur-[5px]"
    on:keydown={escapeKeyHandler.handleKeydown}
    on:click={backdropHandler.handleBackdropClick}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white rounded-lg p-6 w-full {maxWidth} mx-4 relative"
      transition:scale={{ duration: 250, start: 0.95 }}
    >
      <button
        on:click={closeModal}
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        aria-label="Close modal"
        transition:scale={{ duration: 200, delay: 50 }}
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

      <h3
        class="text-xl font-bold text-gray-800 mb-4 pr-8"
        transition:fly={{ y: -20, duration: 300, delay: 100 }}
      >
        {title}
      </h3>

      <div
        class="space-y-6"
        transition:fly={{ y: 20, duration: 300, delay: 150 }}
      >
        <slot />
      </div>

      {#if showDefaultFooter}
        <div
          class="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200"
          transition:fly={{ y: 20, duration: 300, delay: 200 }}
        >
          <button
            on:click={handleCancel}
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-300"
          >
            {cancelText}
          </button>
          <button
            on:click={handleConfirm}
            disabled={confirmDisabled}
            class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmText}
          </button>
        </div>
      {:else}
        <div transition:fly={{ y: 20, duration: 300, delay: 200 }}>
          <slot name="footer" />
        </div>
      {/if}

      <div transition:fly={{ y: 20, duration: 300, delay: 250 }}>
        <slot name="processing" />
      </div>
      <div transition:fly={{ y: 20, duration: 300, delay: 300 }}>
        <slot name="results" />
      </div>
    </div>
  </div>
{/if}
