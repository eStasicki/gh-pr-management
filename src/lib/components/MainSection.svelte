<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    config,
    selectedPRs,
    searchTerm,
    currentUser,
    currentPage,
    prs,
    totalPRs,
    totalPages,
  } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import PRList from "./pr-list/PRList.svelte";
  import ChangeSelectedBaseModal from "./modals/ChangeSelectedBaseModal.svelte";
  import RemoveLabelsModal from "./modals/RemoveLabelsModal.svelte";
  import AddLabelsModal from "./modals/AddLabelsModal.svelte";
  import ActionsMenu from "./ActionsMenu.svelte";
  import { loadUser, loadPRs, getAllUserPRs } from "$lib/utils/apiUtils";
  import { createPRSelectionHandlers } from "$lib/utils/prUtils";
  import { isDemoMode } from "$lib/utils/demoMode";
  import { twMerge } from "$lib";
  import {
    searchPRs,
    initializeSearch,
    updateSearchIndex,
  } from "$lib/utils/searchUtils";

  let t = translations.pl;
  let prListComponent: any;
  let changeSelectedBaseModalOpen = false;
  let removeLabelsModalOpen = false;
  let addLabelsModalOpen = false;
  let allUserPRs: any[] = [];
  let searchTimeout: ReturnType<typeof setTimeout>;
  let filteredPRs: any[] = [];
  let hasLoaded = false; // Flaga żeby uniknąć wielokrotnego ładowania
  let lastDemoMode = false; // Śledź poprzedni stan trybu demo
  let lastSearchTerm = ""; // Śledź poprzedni termin wyszukiwania

  $: if (browser) {
    t = translations[$language];
  }

  let prSelectionHandlers = createPRSelectionHandlers($selectedPRs);

  $: prSelectionHandlers = createPRSelectionHandlers($selectedPRs);

  $: if (isDemoMode() && allUserPRs.length === 0) {
    getAllUserPRs($config, $currentUser, 50).then((allPRs) => {
      allUserPRs = allPRs;
      initializeSearch(allUserPRs);
    });
  }

  // Reactive statement - wykonuje się gdy $config się zmieni
  $: if (
    $config.token &&
    !isDemoMode() &&
    (!hasLoaded || lastDemoMode !== isDemoMode())
  ) {
    hasLoaded = true; // Ustaw flagę żeby uniknąć ponownego ładowania
    lastDemoMode = isDemoMode();

    loadUser($config)
      .then(() => {
        if (!$currentUser?.login) {
          console.error(`[MainSection] No currentUser.login available!`);
          return;
        }

        getAllUserPRs($config, $currentUser)
          .then((allPRs) => {
            allUserPRs = allPRs;
            initializeSearch(allUserPRs);

            // Inicjalizuj filteredPRs z wszystkimi PR-ami
            filteredPRs = allPRs;

            const perPage = 10;
            const startIndex = 0;
            const endIndex = Math.min(startIndex + perPage, filteredPRs.length);
            const pagePRs = filteredPRs.slice(startIndex, endIndex);

            prs.set(pagePRs);
            totalPRs.set(filteredPRs.length);

            const totalPagesCount = Math.ceil(filteredPRs.length / perPage);
            totalPages.set(totalPagesCount);
            currentPage.set(1);
          })
          .catch((error) => {
            console.error(`[MainSection] Error loading PRs:`, error);
          });
      })
      .catch((error) => {
        console.error(`[MainSection] Error loading user:`, error);

        // Jeśli błąd 401 (Unauthorized), włącz tryb demo jako fallback
        if (
          error.message?.includes("401") ||
          error.message?.includes("Unauthorized")
        ) {
          import("$lib/utils/demoMode").then(({ enableDemoMode }) => {
            enableDemoMode();
          });
        }
      });
  }

  // Reactive statement dla trybu demo
  $: if (isDemoMode() && (!hasLoaded || lastDemoMode !== isDemoMode())) {
    hasLoaded = true;
    lastDemoMode = isDemoMode();

    // W trybie demo dane są już załadowane przez enableDemoMode
    // Musimy zainicjalizować filteredPRs z wszystkimi mock PR-ami
    if ($prs.length > 0) {
      // Pobierz wszystkie mock PR-y z getAllUserPRs
      getAllUserPRs($config, $currentUser, 50).then((allPRs) => {
        allUserPRs = allPRs;
        filteredPRs = allPRs;
        initializeSearch(allUserPRs);
      });
    }
  }

  // onMount tylko dla trybu demo
  onMount(() => {
    if (isDemoMode()) {
      // Tryb demo jest już obsługiwany przez reactive statement z $config
    }
  });

  // Function to handle page changes
  function handlePageChange(page: number) {
    const perPage = 10;
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, filteredPRs.length);
    const pagePRs = filteredPRs.slice(startIndex, endIndex);

    prs.set(pagePRs);
    currentPage.set(page);
  }

  let allPRsSelected = false;

  $: {
    allPRsSelected = prSelectionHandlers.isAllPRsSelected(allUserPRs);
  }

  $: if (allUserPRs.length > 0) {
    prSelectionHandlers.validateSelectedPRs(allUserPRs, (selected) => {
      selectedPRs.set(selected);
    });
  }

  // Reactive statement - reaguje na zmiany w $prs (dla trybu demo)
  $: if (isDemoMode() && $prs.length > 0 && filteredPRs.length === 0) {
    // Pobierz wszystkie mock PR-y
    getAllUserPRs($config, $currentUser, 50).then((allPRs) => {
      allUserPRs = allPRs;
      filteredPRs = allPRs;
      initializeSearch(allUserPRs);
    });
  }
  $: if (
    typeof window !== "undefined" &&
    $searchTerm !== undefined &&
    $searchTerm !== "" &&
    lastSearchTerm !== $searchTerm
  ) {
    lastSearchTerm = $searchTerm;

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (allUserPRs.length > 0) {
        filteredPRs = searchPRs(allUserPRs, $searchTerm);

        const perPage = 10;
        const startIndex = 0;
        const endIndex = Math.min(startIndex + perPage, filteredPRs.length);
        const pagePRs = filteredPRs.slice(startIndex, endIndex);

        prs.set(pagePRs);
        totalPRs.set(filteredPRs.length);

        const totalPagesCount = Math.ceil(filteredPRs.length / perPage);
        totalPages.set(totalPagesCount);
        currentPage.set(1);
      }
    }, 300);
  } else if (
    typeof window !== "undefined" &&
    $searchTerm === "" &&
    lastSearchTerm !== ""
  ) {
    // Gdy searchTerm jest pusty, pokaż wszystkie PR-y
    lastSearchTerm = "";

    if (allUserPRs.length > 0) {
      filteredPRs = allUserPRs;

      const perPage = 10;
      const startIndex = ($currentPage - 1) * perPage;
      const endIndex = Math.min(startIndex + perPage, filteredPRs.length);
      const pagePRs = filteredPRs.slice(startIndex, endIndex);

      prs.set(pagePRs);
      totalPRs.set(filteredPRs.length);

      const totalPagesCount = Math.ceil(filteredPRs.length / perPage);
      totalPages.set(totalPagesCount);
    }
  }
</script>

<div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
  <div class="mb-8">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          {t.my_prs}
        </h2>
        {#if $prs.length > 0}
          <p class="text-sm text-gray-600 mt-1">
            {t.loaded_prs
              .replace("{loaded}", String($prs.length))
              .replace("{total}", String($totalPRs))}
          </p>
        {/if}
      </div>
    </div>

    <div
      class="flex flex-col lg:flex-row gap-4 mb-6 items-center justify-between flex-wrap"
    >
      <div
        class={twMerge(
          "flex w-full lg:max-w-sm relative",
          $selectedPRs.length > 0 && "gap-3 flex-row"
        )}
      >
        <input
          type="text"
          placeholder={t.search_prs}
          bind:value={$searchTerm}
          class="flex-1 lg:max-w-80 px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 w-full"
        />

        {#if $selectedPRs.length > 0}
          <div
            class={twMerge(
              "text-sm text-gray-500 flex items-center",
              $selectedPRs.length > 0 &&
                "lg:absolute lg:self-center lg:-right-13"
            )}
          >
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
      </div>

      <ActionsMenu
        bind:allPRsSelected
        on:selectAll={() => prListComponent?.toggleAllPRs()}
        on:refresh={() => {
          getAllUserPRs($config, $currentUser, 50).then((allPRs) => {
            allUserPRs = allPRs;
            updateSearchIndex(allUserPRs);

            filteredPRs = searchPRs(allUserPRs, $searchTerm);

            const perPage = 10;
            const totalPagesCount = Math.ceil(filteredPRs.length / perPage);
            totalPages.set(totalPagesCount);

            // Sprawdź czy currentPage nie przekracza totalPages
            if ($currentPage > totalPagesCount) {
              currentPage.set(1);
            }

            const startIndex = ($currentPage - 1) * perPage;
            const endIndex = Math.min(startIndex + perPage, filteredPRs.length);
            const pagePRs = filteredPRs.slice(startIndex, endIndex);

            prs.set(pagePRs);
            totalPRs.set(filteredPRs.length);
          });
        }}
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

    <PRList
      bind:this={prListComponent}
      onGetAllUserPRs={() => getAllUserPRs($config, $currentUser, 50)}
      onPageChange={handlePageChange}
    />
  </div>
</div>

<ChangeSelectedBaseModal
  bind:isOpen={changeSelectedBaseModalOpen}
  on:refresh={() => {
    getAllUserPRs($config, $currentUser).then((allPRs) => {
      allUserPRs = allPRs;
      updateSearchIndex(allUserPRs);

      filteredPRs = searchPRs(allUserPRs, $searchTerm);

      const perPage = 10;
      const totalPagesCount = Math.ceil(filteredPRs.length / perPage);
      totalPages.set(totalPagesCount);

      // Sprawdź czy currentPage nie przekracza totalPages
      if ($currentPage > totalPagesCount) {
        currentPage.set(1);
      }

      const startIndex = ($currentPage - 1) * perPage;
      const endIndex = Math.min(startIndex + perPage, filteredPRs.length);
      const pagePRs = filteredPRs.slice(startIndex, endIndex);

      prs.set(pagePRs);
      totalPRs.set(filteredPRs.length);
    });
  }}
  onClose={() => (changeSelectedBaseModalOpen = false)}
/>

<RemoveLabelsModal
  bind:isOpen={removeLabelsModalOpen}
  on:refresh={() => {
    getAllUserPRs($config, $currentUser).then((allPRs) => {
      allUserPRs = allPRs;
      updateSearchIndex(allUserPRs);

      filteredPRs = searchPRs(allUserPRs, $searchTerm);

      const perPage = 10;
      const totalPagesCount = Math.ceil(filteredPRs.length / perPage);
      totalPages.set(totalPagesCount);

      // Sprawdź czy currentPage nie przekracza totalPages
      if ($currentPage > totalPagesCount) {
        currentPage.set(1);
      }

      const startIndex = ($currentPage - 1) * perPage;
      const endIndex = Math.min(startIndex + perPage, filteredPRs.length);
      const pagePRs = filteredPRs.slice(startIndex, endIndex);

      prs.set(pagePRs);
      totalPRs.set(filteredPRs.length);
    });
  }}
  onClose={() => (removeLabelsModalOpen = false)}
/>

<AddLabelsModal
  bind:isOpen={addLabelsModalOpen}
  on:refresh={() => {
    getAllUserPRs($config, $currentUser).then((allPRs) => {
      allUserPRs = allPRs;
      updateSearchIndex(allUserPRs);

      filteredPRs = searchPRs(allUserPRs, $searchTerm);

      const perPage = 10;
      const totalPagesCount = Math.ceil(filteredPRs.length / perPage);
      totalPages.set(totalPagesCount);

      // Sprawdź czy currentPage nie przekracza totalPages
      if ($currentPage > totalPagesCount) {
        currentPage.set(1);
      }

      const startIndex = ($currentPage - 1) * perPage;
      const endIndex = Math.min(startIndex + perPage, filteredPRs.length);
      const pagePRs = filteredPRs.slice(startIndex, endIndex);

      prs.set(pagePRs);
      totalPRs.set(filteredPRs.length);
    });
  }}
  onClose={() => (addLabelsModalOpen = false)}
/>
