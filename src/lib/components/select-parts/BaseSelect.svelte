<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { fade, fly, scale } from "svelte/transition";
  import { createClickOutsideHandler } from "$lib/utils/uiUtils";
  import {
    createEscapeKeyHandler,
    createArrowKeyHandler,
  } from "$lib/utils/keyboardUtils";

  export let searchTerm = "";
  export let selectedIndex = -1;
  export let selectedValue = "";
  export let dropdownElement: HTMLDivElement;
  let containerElement: HTMLDivElement;
  export let onToggle: () => void = () => {};
  export let onClose: () => void = () => {};
  export let onSearchChange: (term: string) => void = () => {};
  export let onIndexChange: (index: number) => void = () => {};
  export let onSelect: (item: any) => void = () => {};
  export let onValueChange: (value: string) => void = () => {};
  export let items: any[] = [];
  export let displayField: string = "";
  export let isMultiSelect: boolean = false;
  export let selectedItems: any[] = [];

  $: slotItems = items;
  $: slotSelectedIndex = selectedIndex;

  function isItemSelected(item: any): boolean {
    if (!isMultiSelect || !selectedItems) return false;
    const value = displayField ? item[displayField] : item;
    return selectedItems.some((selected) => {
      const selectedValue = displayField ? selected[displayField] : selected;
      return selectedValue === value;
    });
  }
  export let isLoading = false;
  export let error = "";
  export let onRetry: () => void = () => {};
  export let emptyMessage = "No items";
  export let noResultsMessage = "No results found";
  export let loadingMessage = "Loading...";
  export let tryAgainText = "Try again";

  let isOpen = false;

  let clickOutsideHandler: ReturnType<typeof createClickOutsideHandler>;
  let escapeKeyHandler: ReturnType<typeof createEscapeKeyHandler>;
  let arrowKeyHandler: ReturnType<typeof createArrowKeyHandler>;

  function handleToggle() {
    isOpen = !isOpen;
    if (isOpen) {
      searchTerm = "";
      selectedIndex = -1;
    }
    onToggle();
  }

  function handleClose() {
    isOpen = false;
    searchTerm = "";
    selectedIndex = -1;
    onClose();
  }

  function handleSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    onSearchChange(target.value);
  }

  function handleKeydown(event: KeyboardEvent) {
    // Handle escape key even when closed
    if (event.key === "Escape") {
      escapeKeyHandler.handleKeydown(event);
      return;
    }

    // Handle other keys only when open
    if (!isOpen) return;

    arrowKeyHandler.handleKeydown(event);
  }

  function scrollToSelectedItem() {
    if (dropdownElement && slotSelectedIndex >= 0) {
      const selectedElement = dropdownElement.querySelector(
        `[data-index="${slotSelectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }

  onMount(() => {
    escapeKeyHandler = createEscapeKeyHandler(handleClose);
  });

  $: {
    arrowKeyHandler = createArrowKeyHandler(
      slotItems,
      slotSelectedIndex,
      (index) => {
        onIndexChange(index);
        scrollToSelectedItem();
      },
      (item) => {
        onSelect(item);
        const value = displayField ? item[displayField] : item;
        onValueChange(value);
        handleClose();
      }
    );
  }

  // Setup click outside handler when dropdown opens
  $: if (isOpen) {
    setupClickOutsideHandler();
  } else {
    removeClickOutsideHandler();
  }

  async function setupClickOutsideHandler() {
    // Wait for DOM to update
    await tick();

    if (!containerElement) {
      return;
    }

    // Remove existing handler if any
    if (clickOutsideHandler) {
      clickOutsideHandler.removeEventListener();
    }

    // Add new handler
    clickOutsideHandler = createClickOutsideHandler(
      containerElement,
      true,
      handleClose
    );
    clickOutsideHandler.addEventListener();
  }

  function removeClickOutsideHandler() {
    if (clickOutsideHandler) {
      clickOutsideHandler.removeEventListener();
      clickOutsideHandler = null;
    }
  }

  onDestroy(() => {
    if (clickOutsideHandler) {
      clickOutsideHandler.removeEventListener();
    }
  });
</script>

<div class="relative" bind:this={containerElement}>
  <div class="relative">
    <input
      type="text"
      value={isOpen ? searchTerm : selectedValue}
      on:input={handleSearchChange}
      on:click={handleToggle}
      on:keydown={handleKeydown}
      class="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg text-base transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />

    <button
      type="button"
      on:click={handleToggle}
      class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
      aria-label="Toggle dropdown"
    >
      <svg
        class="w-5 h-5 transition-transform duration-200 {isOpen
          ? 'rotate-180'
          : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        ></path>
      </svg>
    </button>
  </div>

  {#if isOpen}
    <div
      bind:this={dropdownElement}
      class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      transition:fly={{ y: -10, duration: 200 }}
    >
      {#if isLoading}
        <div class="p-4 text-center text-gray-500">
          <div
            class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
          ></div>
          <p class="mt-2">{loadingMessage}</p>
        </div>
      {:else if error}
        <div class="p-4 text-center text-red-500">
          <p class="mb-2">{error}</p>
          <button
            on:click={onRetry}
            class="text-blue-600 hover:text-blue-800 underline"
          >
            {tryAgainText}
          </button>
        </div>
      {:else if items.length === 0}
        <div class="p-4 text-center text-gray-500">
          {#if searchTerm.trim()}
            <p>{noResultsMessage} "{searchTerm}"</p>
          {:else}
            <p>{emptyMessage}</p>
          {/if}
        </div>
      {:else if slotItems && slotItems.length > 0}
        <div class="max-h-60 overflow-y-auto">
          {#each slotItems as item, index}
            <button
              type="button"
              data-index={index}
              class="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-200 last:border-b-0 transition-colors duration-150 {slotSelectedIndex ===
              index
                ? 'bg-gray-100 text-gray-900'
                : isItemSelected(item)
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-700'}"
              on:click={() => {
                onSelect(item);
                const value = displayField ? item[displayField] : item;
                onValueChange(value);
                if (!isMultiSelect) {
                  handleClose();
                }
              }}
              transition:fade={{ duration: 150, delay: index * 20 }}
            >
              <div class="flex items-center justify-between">
                <span class="font-mono text-sm">
                  {displayField ? item[displayField] : item}
                </span>
                {#if isItemSelected(item)}
                  <svg
                    class="w-4 h-4 text-green-600 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    transition:scale={{ duration: 200 }}
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <div class="p-4 text-center text-gray-500">
          <p>No data in slotItems: {JSON.stringify(slotItems)}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
