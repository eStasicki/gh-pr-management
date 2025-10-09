<script lang="ts">
  import { onMount } from "svelte";
  import { githubAPI } from "$lib/services/github-api";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import BaseSelect from "./select-parts/BaseSelect.svelte";

  export let selectedBranch = "";
  export let onBranchSelect: (branch: string) => void = () => {};

  let t = translations.pl;
  let allBranches: string[] = [];
  let filteredBranches: string[] = [];
  let searchTerm = "";
  let isLoading = false;
  let error = "";
  let selectedIndex = -1;
  let dropdownElement: HTMLDivElement;

  $: if (browser) {
    t = translations[$language];
  }

  $: {
    if (!allBranches) {
      filteredBranches = [];
    } else if (searchTerm.trim()) {
      const filtered = allBranches.filter((branch) =>
        branch.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (selectedBranch && filtered.includes(selectedBranch)) {
        filteredBranches = [
          selectedBranch,
          ...filtered.filter((branch) => branch !== selectedBranch),
        ];
      } else {
        filteredBranches = filtered;
      }
    } else {
      if (selectedBranch && allBranches.includes(selectedBranch)) {
        filteredBranches = [
          selectedBranch,
          ...allBranches.filter((branch) => branch !== selectedBranch),
        ];
      } else {
        filteredBranches = allBranches;
      }
    }

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
    selectedBranch = branch;
    onBranchSelect(branch);
    searchTerm = "";
  }

  function handleToggle() {
    // BaseSelect zarządza swoim własnym stanem isOpen
  }

  function handleClose() {
    // BaseSelect zarządza swoim własnym stanem isOpen
  }

  function handleSearchChange(term: string) {
    searchTerm = term;
  }

  function handleIndexChange(index: number) {
    selectedIndex = index;
  }

  function handleSelect(branch: string) {
    selectBranch(branch);
  }
</script>

<div class="relative">
  <label
    for="branch-selector"
    class="block text-sm font-semibold text-gray-700 mb-2"
  >
    Base branch:
  </label>

  <BaseSelect
    bind:searchTerm
    bind:selectedIndex
    bind:dropdownElement
    selectedValue={selectedBranch}
    onToggle={handleToggle}
    onClose={handleClose}
    onSearchChange={handleSearchChange}
    onIndexChange={handleIndexChange}
    onSelect={handleSelect}
    onValueChange={(value) => (selectedBranch = value)}
    items={filteredBranches}
    {isLoading}
    {error}
    onRetry={loadBranches}
    emptyMessage={t.no_branches_available}
    noResultsMessage={t.no_branches_found}
    loadingMessage={t.loading_branches}
    tryAgainText={t.try_again}
  >
    <div slot="default" let:items let:selectedIndex>
      {#each items as branch, index}
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
    </div>
  </BaseSelect>
</div>
