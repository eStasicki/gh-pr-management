<script lang="ts">
  import { onMount } from "svelte";
  import { githubAPI } from "$lib/services/github-api";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";

  // Single-select branch picker - only one branch can be selected
  export let selectedBranch = "";
  export let onBranchSelect: (branch: string) => void = () => {};

  let t = translations.pl;

  let allBranches: string[] = [];
  let filteredBranches: string[] = [];
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
      const filtered = allBranches.filter((branch) =>
        branch.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Move selected branch to top if it matches search
      if (selectedBranch && filtered.includes(selectedBranch)) {
        filteredBranches = [
          selectedBranch,
          ...filtered.filter((branch) => branch !== selectedBranch),
        ];
      } else {
        filteredBranches = filtered;
      }
    } else {
      // Move selected branch to top when no search
      if (selectedBranch && allBranches.includes(selectedBranch)) {
        filteredBranches = [
          selectedBranch,
          ...allBranches.filter((branch) => branch !== selectedBranch),
        ];
      } else {
        filteredBranches = allBranches;
      }
    }

    // Reset selected index when filtered branches change
    selectedIndex = -1;
  }

  onMount(async () => {
    await loadBranches();
  });

  async function loadBranches() {
    isLoading = true;
    error = "";
    try {
      allBranches = await githubAPI.getBranches();
      filteredBranches = allBranches;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load branches";
    } finally {
      isLoading = false;
    }
  }

  function selectBranch(branch: string) {
    // Single selection - replace current selection
    selectedBranch = branch;
    onBranchSelect(branch);
    isOpen = false;
    searchTerm = "";
  }

  function toggleDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      searchTerm = "";
      selectedIndex = -1;
    }
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
        selectedIndex = Math.min(
          selectedIndex + 1,
          filteredBranches.length - 1
        );
        scrollToSelectedItem();
        break;
      case "ArrowUp":
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        scrollToSelectedItem();
        break;
      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredBranches.length) {
          selectBranch(filteredBranches[selectedIndex]);
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
</script>

<div class="relative">
  <label
    for="branch-selector"
    class="block text-sm font-semibold text-gray-700 mb-2"
  >
    Base branch:
  </label>

  <div class="relative">
    <input
      id="branch-selector"
      type="text"
      bind:value={searchTerm}
      on:focus={toggleDropdown}
      on:keydown={handleKeydown}
      placeholder={selectedBranch || t.search_branches}
      class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />

    <button
      type="button"
      on:click={toggleDropdown}
      class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      aria-label="Toggle branch dropdown"
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
          <p class="mt-2">{t.loading_branches}</p>
        </div>
      {:else if error}
        <div class="p-4 text-center text-red-500">
          <p class="mb-2">{error}</p>
          <button
            on:click={loadBranches}
            class="text-blue-600 hover:text-blue-800 underline"
          >
            {t.try_again}
          </button>
        </div>
      {:else if filteredBranches.length === 0}
        <div class="p-4 text-center text-gray-500">
          {#if searchTerm.trim()}
            <p>{t.no_branches_found} "{searchTerm}"</p>
          {:else}
            <p>{t.no_branches_available}</p>
          {/if}
        </div>
      {:else}
        {#each filteredBranches as branch, index}
          <button
            type="button"
            data-index={index}
            on:click={() => selectBranch(branch)}
            class="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-200 last:border-b-0 {branch ===
            selectedBranch
              ? 'bg-green-100 text-green-600'
              : selectedIndex === index
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-700'}"
          >
            <div class="flex items-center justify-between">
              <span class="font-mono text-sm">{branch}</span>
              {#if branch === selectedBranch}
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
