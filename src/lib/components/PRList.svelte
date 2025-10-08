<script lang="ts">
  import { onMount } from "svelte";
  import {
    prs,
    currentUser,
    isLoading,
    currentPage,
    totalPages,
    totalPRs,
    searchTerm,
    selectedPRs,
  } from "$lib/stores";
  import { auth } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import type { GitHubPR } from "$lib/types";

  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  // Watch for search term changes and reload data with debouncing
  let searchTimeout: number;

  $: if ($searchTerm !== undefined) {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    searchTimeout = setTimeout(() => {
      // Reset to page 1 when search term changes
      if ($searchTerm !== "") {
        currentPage.set(1);
      }
      // Trigger reload with new search term
      loadPRsForPage(1);
    }, 500); // 500ms debounce
  }

  // No client-side filtering needed - search is done server-side
  $: filteredPRs = $prs;

  function togglePRSelection(prNumber: number) {
    const currentSelected = $selectedPRs;
    if (currentSelected.includes(prNumber)) {
      selectedPRs.set(currentSelected.filter((num) => num !== prNumber));
    } else {
      selectedPRs.set([...currentSelected, prNumber]);
    }
  }

  // Create a reactive map of selected PRs for better performance
  $: selectedPRsMap = new Set($selectedPRs);

  // Reactive function for checking if PR is selected
  function isPRSelected(prNumber: number): boolean {
    return selectedPRsMap.has(prNumber);
  }

  // Generate skeleton loading items
  function generateSkeletonItems(count: number = 5) {
    return Array.from({ length: count }, (_, i) => i);
  }

  export async function toggleAllPRs() {
    // Check if all user's PRs are selected (not just current page)
    const allUserPRsSelected = await checkIfAllUserPRsSelected();

    if (allUserPRsSelected) {
      // Deselect all user's PRs
      selectedPRs.set([]);
    } else {
      // Select all user's PRs
      const allUserPRs = await getAllUserPRs();
      const allPRNumbers = allUserPRs.map((pr) => pr.number);
      selectedPRs.set(allPRNumbers);
    }
  }

  async function checkIfAllUserPRsSelected(): Promise<boolean> {
    const allUserPRs = await getAllUserPRs();
    const allPRNumbers = allUserPRs.map((pr) => pr.number);
    return (
      allPRNumbers.length > 0 &&
      allPRNumbers.every((num) => $selectedPRs.includes(num))
    );
  }

  async function getAllUserPRs(): Promise<any[]> {
    // This will be handled by the parent component
    // We'll emit an event to get all user PRs
    return new Promise((resolve) => {
      const handleResponse = (event: CustomEvent) => {
        window.removeEventListener(
          "allUserPRsResponse",
          handleResponse as EventListener
        );
        resolve(event.detail.prs);
      };

      window.addEventListener(
        "allUserPRsResponse",
        handleResponse as EventListener
      );
      window.dispatchEvent(new CustomEvent("getAllUserPRs"));
    });
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= $totalPages) {
      loadPRsForPage(page);
    }
  }

  function nextPage() {
    if ($currentPage < $totalPages) {
      loadPRsForPage($currentPage + 1);
    }
  }

  function prevPage() {
    if ($currentPage > 1) {
      loadPRsForPage($currentPage - 1);
    }
  }

  async function loadPRsForPage(page: number) {
    // This will be handled by the parent component
    // We'll emit an event to trigger the load
    const event = new CustomEvent("loadPRs", { detail: { page } });
    window.dispatchEvent(event);
  }
</script>

<div class="grid gap-4">
  {#if $isLoading}
    <div class="flex justify-center items-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"
        ></div>
        <p class="text-gray-600 font-medium">{t.loading}</p>
      </div>
    </div>
  {:else if $auth.showConnectionLostModal}
    {#each generateSkeletonItems() as skeletonItem}
      <div
        role="status"
        class="rounded-xl p-5 border-2 border-gray-200 bg-gray-50 animate-pulse"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-start gap-3 flex-1">
            <div class="h-6 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div class="h-6 bg-gray-200 rounded w-12 flex-shrink-0"></div>
        </div>

        <div class="flex flex-col lg:items-center lg:flex-row gap-2 mb-3">
          <div class="h-4 bg-gray-200 rounded w-20"></div>
          <div class="h-4 bg-gray-200 rounded w-32"></div>
          <div class="h-4 bg-gray-200 rounded w-16"></div>
          <div class="h-4 bg-gray-200 rounded w-40"></div>
        </div>

        <div class="flex flex-wrap gap-2">
          <div class="h-6 bg-gray-200 rounded w-16"></div>
          <div class="h-6 bg-gray-200 rounded w-20"></div>
          <div class="h-6 bg-gray-200 rounded w-12"></div>
        </div>
        <span class="sr-only">Loading...</span>
      </div>
    {/each}
  {:else if filteredPRs.length === 0}
    <div class="text-center py-12">
      <p class="text-gray-500 text-lg">{t.no_prs_found}</p>
    </div>
  {:else}
    {#each filteredPRs as pr (pr.number)}
      <div
        on:click={() => togglePRSelection(pr.number)}
        role="checkbox"
        tabindex="0"
        aria-checked={$selectedPRs.includes(pr.number)}
        aria-label="Select PR #{pr.number}: {pr.title}"
        on:keydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            togglePRSelection(pr.number);
          }
        }}
        class="rounded-xl p-5 transition-all duration-300 cursor-pointer hover:border-primary-500 hover:-translate-y-0.5 hover:shadow-lg border-2 select-none focus:outline-none {$selectedPRs.includes(
          pr.number
        )
          ? 'bg-gray-200 border-primary-500'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-start gap-3 flex-1">
            <div class="font-semibold text-gray-800 text-lg pr-4 flex-1">
              {pr.title}
            </div>
          </div>
          <a
            href={pr.html_url}
            target="_blank"
            class="bg-primary-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex-shrink-0 bg-blue-500 hover:bg-blue-600 transition-all duration-300"
          >
            #{pr.number}
          </a>
        </div>

        <div
          class="flex flex-col lg:items-center lg:flex-row gap-2 mb-3 text-sm text-gray-500"
        >
          <span>Base: {pr.base.ref}</span>
          <span class="font-semibold text-primary-600">
            {t.author}: {pr.user.login}
          </span>
          <span
            class="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 max-lg:order-1 max-w-max border border-green-300"
          >
            {pr.state.toUpperCase()}
          </span>
          <span
            >{t.last_updated}: {new Date(pr.updated_at).toLocaleDateString(
              $language,
              {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}</span
          >
        </div>

        <div class="flex flex-wrap gap-2">
          {#each pr.labels as label}
            <span
              class="px-2 py-1 rounded-md text-xs font-medium text-white"
              style="background-color: #{label.color}"
            >
              {label.name}
            </span>
          {/each}
        </div>
      </div>
    {/each}

    {#if $totalPages > 1}
      <div class="flex justify-center items-center gap-4 mt-2 pt-2">
        <button
          on:click={prevPage}
          disabled={$currentPage === 1}
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
        >
          {t.previous || "Previous"}
        </button>

        <div class="flex gap-2">
          {#each Array.from({ length: Math.min(5, $totalPages) }, (_, i) => {
            const startPage = Math.max(1, Math.min($currentPage - 2, $totalPages - 4));
            return startPage + i;
          }) as page}
            <button
              on:click={() => goToPage(page)}
              class="px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md {$currentPage ===
              page
                ? 'bg-blue-500 text-white'
                : 'border border-gray-300 hover:bg-gray-50'}"
            >
              {page}
            </button>
          {/each}
        </div>

        <button
          on:click={nextPage}
          disabled={$currentPage === $totalPages}
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
        >
          {t.next || "Next"}
        </button>
      </div>

      <div class="text-center mt-2 text-sm text-gray-600">
        {t.pagination_page}
        {$currentPage}
        {t.pagination_of}
        {$totalPages} - {t.pagination_showing}
        {filteredPRs.length}
        {t.pagination_prs}
      </div>
    {/if}
  {/if}
</div>
