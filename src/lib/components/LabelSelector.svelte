<script lang="ts">
  import { onMount } from "svelte";
  import { githubAPI } from "$lib/services/github-api";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";

  // Multi-select label picker
  export let selectedLabels: string[] = [];
  export let onLabelsChange: (labels: string[]) => void = () => {};

  let t = translations.pl;

  let allLabels: Array<{ name: string; color: string }> = [];
  let filteredLabels: Array<{ name: string; color: string }> = [];
  let searchTerm = "";
  let isOpen = false;
  let isLoading = false;
  let error = "";
  let selectedIndex = -1;
  let dropdownElement: HTMLDivElement;

  $: if (browser) {
    t = translations[$language];
  }

  $: {
    if (searchTerm.trim()) {
      const filtered = allLabels.filter((label) =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Move selected labels to top if they match search
      const selectedInFiltered = filtered.filter((label) =>
        selectedLabels.includes(label.name)
      );
      const unselectedInFiltered = filtered.filter(
        (label) => !selectedLabels.includes(label.name)
      );
      filteredLabels = [...selectedInFiltered, ...unselectedInFiltered];
    } else {
      // Move selected labels to top when no search
      const selectedLabels_ = allLabels.filter((label) =>
        selectedLabels.includes(label.name)
      );
      const unselectedLabels = allLabels.filter(
        (label) => !selectedLabels.includes(label.name)
      );
      filteredLabels = [...selectedLabels_, ...unselectedLabels];
    }

    // Reset selected index when filtered labels change
    selectedIndex = -1;
  }

  onMount(async () => {
    await loadLabels();
  });

  async function loadLabels() {
    isLoading = true;
    error = "";
    try {
      allLabels = await githubAPI.getLabels();
      filteredLabels = allLabels;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load labels";
    } finally {
      isLoading = false;
    }
  }

  function toggleLabel(labelName: string) {
    if (selectedLabels.includes(labelName)) {
      selectedLabels = selectedLabels.filter((name) => name !== labelName);
    } else {
      selectedLabels = [...selectedLabels, labelName];
    }
    onLabelsChange(selectedLabels);
  }

  function removeLabel(labelName: string) {
    selectedLabels = selectedLabels.filter((name) => name !== labelName);
    onLabelsChange(selectedLabels);
  }

  function toggleDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      searchTerm = "";
      selectedIndex = -1;
    }
  }

  function openDropdown() {
    isOpen = true;
    searchTerm = "";
    selectedIndex = -1;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    switch (event.key) {
      case "Escape":
        isOpen = false;
        searchTerm = "";
        selectedIndex = -1;
        break;
      case "ArrowDown":
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredLabels.length - 1);
        scrollToSelectedItem();
        break;
      case "ArrowUp":
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollToSelectedItem();
        break;
      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredLabels.length) {
          toggleLabel(filteredLabels[selectedIndex].name);
        }
        break;
    }
  }

  function scrollToSelectedItem() {
    if (dropdownElement && selectedIndex >= 0) {
      const selectedElement = dropdownElement.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
      // Don't close if clicking on the input or button
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.id === "label-selector" ||
          target.closest('button[aria-label="Toggle labels dropdown"]'))
      ) {
        return;
      }
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });
</script>

<div class="relative">
  <label
    for="label-selector"
    class="block text-sm font-semibold text-gray-700 mb-2"
  >
    {t.select_labels}{#if selectedLabels.length > 0}&nbsp;({selectedLabels.length}){/if}:
  </label>

  {#if selectedLabels.length > 0}
    <div class="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div class="flex flex-wrap gap-2">
        {#each selectedLabels as labelName}
          <span
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
            style="background-color: #{allLabels.find(
              (l) => l.name === labelName
            )?.color || 'e0e0e0'};"
          >
            {labelName}
            <button
              type="button"
              on:click={() => toggleLabel(labelName)}
              class="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-white hover:bg-black hover:bg-opacity-20 focus:outline-none focus:bg-black focus:bg-opacity-20 transition-colors"
              aria-label="Remove label {labelName}"
            >
              <svg
                class="h-2.5 w-2.5"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 8 8"
              >
                <path
                  stroke-linecap="round"
                  stroke-width="1.5"
                  d="M1 1l6 6m0-6L1 7"
                ></path>
              </svg>
            </button>
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <div class="relative">
    <input
      id="label-selector"
      type="text"
      bind:value={searchTerm}
      on:focus={openDropdown}
      on:keydown={handleKeydown}
      placeholder={t.select_labels}
      class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />

    <button
      type="button"
      on:click={toggleDropdown}
      class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      aria-label="Toggle labels dropdown"
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
    >
      {#if isLoading}
        <div class="p-4 text-center text-gray-500">
          <div
            class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
          ></div>
          <p class="mt-2">{t.loading_labels}</p>
        </div>
      {:else if error}
        <div class="p-4 text-center text-red-500">
          <p class="mb-2">{error}</p>
          <button
            on:click={loadLabels}
            class="text-blue-600 hover:text-blue-800 underline"
          >
            {t.try_again}
          </button>
        </div>
      {:else if filteredLabels.length === 0}
        <div class="p-4 text-center text-gray-500">
          {#if searchTerm.trim()}
            <p>{t.no_labels_found} "{searchTerm}"</p>
          {:else}
            <p>{t.no_labels_available}</p>
          {/if}
        </div>
      {:else}
        {#each filteredLabels as label, index}
          <button
            type="button"
            data-index={index}
            on:click={() => toggleLabel(label.name)}
            class="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none {selectedLabels.includes(
              label.name
            )
              ? 'bg-blue-50 text-blue-700'
              : selectedIndex === index
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-700'}"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full"
                  style="background-color: #{label.color}"
                ></div>
                <span class="font-medium text-sm">{label.name}</span>
              </div>
              {#if selectedLabels.includes(label.name)}
                <svg
                  class="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
      {/if}
    </div>
  {/if}
</div>
