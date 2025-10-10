<script lang="ts">
  import { onMount } from "svelte";
  import { createClickOutsideHandlerWithSelector } from "$lib/utils/uiUtils";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import Navigation from "../Navigation.svelte";

  export let isOpen = false;
  export let onClose: () => void;

  let t = translations.pl;
  let clickOutsideHandler: ReturnType<
    typeof createClickOutsideHandlerWithSelector
  >;

  $: if (browser) {
    t = translations[$language];
  }

  onMount(() => {
    clickOutsideHandler = createClickOutsideHandlerWithSelector(
      ".mobile-nav-modal",
      () => {
        if (isOpen) {
          onClose();
        }
      }
    );

    return () => {
      if (clickOutsideHandler) {
        clickOutsideHandler.removeEventListener();
      }
    };
  });

  $: if (isOpen) {
    setTimeout(() => {
      if (clickOutsideHandler) {
        clickOutsideHandler.addEventListener();
      }
    }, 100);
  } else {
    if (clickOutsideHandler) {
      clickOutsideHandler.removeEventListener();
    }
  }

  function handleLinkClick() {
    onClose();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && isOpen) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="fixed inset-0 z-[9999] mobile-nav-modal">
    <button
      class="absolute inset-0 bg-black bg-opacity-50 w-full h-full border-none p-0 cursor-pointer"
      on:click={onClose}
      aria-label={t.close_menu}
    ></button>

    <div class="absolute inset-0 bg-white flex flex-col pointer-events-none">
      <div class="pointer-events-auto">
        <div
          class="flex justify-between items-center p-6 border-b border-gray-200"
        >
          <h1 class="text-2xl font-bold text-gray-800">GitHub PR Management</h1>
          <button
            on:click={onClose}
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label={t.close_menu}
          >
            <svg
              class="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="flex-1 p-6">
          <Navigation isMobile={true} onLinkClick={handleLinkClick} />
        </div>
      </div>
    </div>
  </div>
{/if}
