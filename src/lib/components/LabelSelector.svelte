<script lang="ts">
  import { onMount } from "svelte";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import {
    labels,
    isLoadingLabels,
    labelsError,
    loadLabels,
  } from "$lib/stores";
  import { createArrayToggleHandler } from "$lib/utils/arrayUtils";
  import BaseSelect from "./select-parts/BaseSelect.svelte";

  export let selectedLabels: string[] = [];
  export let onLabelsChange: (labels: string[]) => void = () => {};

  let t = translations.pl;
  let filteredLabels: Array<{ name: string; color: string }> = [];
  let searchTerm = "";
  let selectedIndex = -1;
  let dropdownElement: HTMLDivElement;

  $: if (browser) {
    t = translations[$language];
  }

  let arrayHandlers = createArrayToggleHandler(selectedLabels, onLabelsChange);

  $: arrayHandlers = createArrayToggleHandler(selectedLabels, onLabelsChange);

  $: {
    if (!$labels) {
      filteredLabels = [];
    } else if (searchTerm.trim()) {
      const filtered = $labels.filter((label) =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const selectedInFiltered = filtered.filter((label) =>
        selectedLabels.includes(label.name)
      );
      const unselectedInFiltered = filtered.filter(
        (label) => !selectedLabels.includes(label.name)
      );
      filteredLabels = [...selectedInFiltered, ...unselectedInFiltered];
    } else {
      const selectedLabels_ = $labels.filter((label) =>
        selectedLabels.includes(label.name)
      );
      const unselectedLabels = $labels.filter(
        (label) => !selectedLabels.includes(label.name)
      );
      filteredLabels = [...selectedLabels_, ...unselectedLabels];
    }

    selectedIndex = -1;
  }

  onMount(async () => {
    await loadLabels();
  });

  export async function refreshLabels() {
    await loadLabels();
  }

  function toggleLabel(labelName: string) {
    arrayHandlers.toggleItem(labelName);
  }

  function removeLabel(labelName: string) {
    arrayHandlers.removeItem(labelName);
  }

  function handleToggle() {
    // BaseSelect manages its own isOpen state
  }

  function handleClose() {
    // BaseSelect manages its own isOpen state
  }

  function handleSearchChange(term: string) {
    searchTerm = term;
  }

  function handleIndexChange(index: number) {
    selectedIndex = index;
  }

  function handleSelect(label: { name: string; color: string }) {
    toggleLabel(label.name);
  }
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
            style="background-color: #{$labels.find((l) => l.name === labelName)
              ?.color || 'e0e0e0'};"
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

  <BaseSelect
    bind:searchTerm
    bind:selectedIndex
    bind:dropdownElement
    displayField="name"
    isMultiSelect={true}
    selectedItems={selectedLabels.map((labelName) => ({
      name: labelName,
      color: "",
    }))}
    onToggle={handleToggle}
    onClose={handleClose}
    onSearchChange={handleSearchChange}
    onIndexChange={handleIndexChange}
    onSelect={handleSelect}
    items={filteredLabels}
    isLoading={$isLoadingLabels}
    error={$labelsError || ""}
    onRetry={loadLabels}
    emptyMessage={t.no_labels_available}
    noResultsMessage={t.no_labels_found}
    loadingMessage={t.loading_labels}
    tryAgainText={t.try_again}
  >
    <div slot="default" let:items let:selectedIndex>
      {#each items as label, index}
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
    </div>
  </BaseSelect>
</div>
