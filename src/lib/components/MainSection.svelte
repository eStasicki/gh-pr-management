<script lang="ts">
  import { onMount } from "svelte";
  import {
    config,
    selectedPRs,
    searchTerm,
    currentUser,
    currentPage,
  } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import PRList from "./PRList.svelte";
  import ChangeSelectedBaseModal from "./modals/ChangeSelectedBaseModal.svelte";
  import RemoveLabelsModal from "./modals/RemoveLabelsModal.svelte";
  import AddLabelsModal from "./modals/AddLabelsModal.svelte";
  import ActionsMenu from "./ActionsMenu.svelte";
  import { loadUser, loadPRs, getAllUserPRs } from "$lib/utils/apiUtils";
  import { createPRSelectionHandlers } from "$lib/utils/prUtils";

  let t = translations.pl;
  let prListComponent: any;
  let changeSelectedBaseModalOpen = false;
  let removeLabelsModalOpen = false;
  let addLabelsModalOpen = false;
  let allUserPRs: any[] = [];

  $: if (browser) {
    t = translations[$language];
  }

  let prSelectionHandlers = createPRSelectionHandlers($selectedPRs);

  $: prSelectionHandlers = createPRSelectionHandlers($selectedPRs);

  onMount(() => {
    loadUser($config).then(() => {
      loadPRs(1, $config, $currentUser, $searchTerm);
      getAllUserPRs($config, $currentUser, $searchTerm).then((prs) => {
        allUserPRs = prs;
      });
    });
  });

  let allPRsSelected = false;

  $: {
    allPRsSelected = prSelectionHandlers.isAllPRsSelected(allUserPRs);
  }

  $: if (allUserPRs.length > 0) {
    prSelectionHandlers.validateSelectedPRs(allUserPRs, (selected) => {
      selectedPRs.set(selected);
    });
  }

  let searchTimeout: number;
  $: if (typeof window !== "undefined" && $searchTerm !== undefined) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      // Load PRs for page 1 with new search term
      loadPRs(1, $config, $currentUser, $searchTerm);
      // Also get all user PRs for selection logic
      getAllUserPRs($config, $currentUser, $searchTerm).then((prs) => {
        allUserPRs = prs;
      });
    }, 500);
  }
</script>

<div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
  <div class="mb-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">
        {t.my_prs}
      </h2>
    </div>

    <div
      class="flex flex-col lg:flex-row gap-4 mb-6 items-center justify-between"
    >
      <input
        type="text"
        placeholder={t.search_prs}
        bind:value={$searchTerm}
        class="flex-1 lg:max-w-sm px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 w-full"
      />

      <ActionsMenu
        bind:allPRsSelected
        on:selectAll={() => prListComponent?.toggleAllPRs()}
        on:refresh={() =>
          loadPRs($currentPage, $config, $currentUser, $searchTerm)}
        on:changeSelectedBase={() => {
          if ($selectedPRs.length > 0) {
            changeSelectedBaseModalOpen = true;
          }
        }}
        on:removeLabels={() => {
          if ($selectedPRs.length > 0) {
            removeLabelsModalOpen = true;
          }
        }}
        on:addLabels={() => {
          if ($selectedPRs.length > 0) {
            addLabelsModalOpen = true;
          }
        }}
      />
    </div>

    {#if $selectedPRs.length > 0}
      <div class="text-sm text-gray-500 mb-6 flex items-center justify-between">
        <span class="text-primary-600 font-semibold flex items-center">
          {t.selected}: {$selectedPRs.length}
          <button
            on:click={() => selectedPRs.set([])}
            class="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full hover:bg-red-50 relative top-[1px] ml-1"
            title="Clear selection"
          >
            <svg
              class="w-4 h-4"
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
        </span>
      </div>
    {/if}

    <PRList
      bind:this={prListComponent}
      onLoadPRs={(page) => loadPRs(page, $config, $currentUser, $searchTerm)}
      onGetAllUserPRs={() => getAllUserPRs($config, $currentUser, $searchTerm)}
    />
  </div>
</div>

<ChangeSelectedBaseModal
  bind:isOpen={changeSelectedBaseModalOpen}
  onClose={() => (changeSelectedBaseModalOpen = false)}
/>

<RemoveLabelsModal
  bind:isOpen={removeLabelsModalOpen}
  onClose={() => (removeLabelsModalOpen = false)}
/>

<AddLabelsModal
  bind:isOpen={addLabelsModalOpen}
  onClose={() => (addLabelsModalOpen = false)}
/>
