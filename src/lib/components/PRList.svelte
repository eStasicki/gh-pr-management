<script lang="ts">
  import {
    prs,
    currentUser,
    isLoading,
    currentPage,
    totalPages,
    totalPRs,
    selectedPRs,
  } from "$lib/stores";
  import { auth } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import type { GitHubPR } from "$lib/types";
  import { PER_PAGE } from "$lib/consts";
  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
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

  // Generate skeleton loading items
  function generateSkeletonItems(count: number = 5) {
    return Array.from({ length: count }, (_, i) => i);
  }

  export let onGetAllUserPRs: () => Promise<any[]>;

  export async function toggleAllPRs() {
    // Check if all user's PRs are selected (not just current page)
    const allUserPRsSelected = await checkIfAllUserPRsSelected();

    if (allUserPRsSelected) {
      // Deselect all user's PRs
      selectedPRs.set([]);
    } else {
      // Select all user's PRs
      const allUserPRs = await onGetAllUserPRs();
      const allPRNumbers = allUserPRs.map((pr) => pr.number);
      selectedPRs.set(allPRNumbers);
    }
  }

  async function checkIfAllUserPRsSelected(): Promise<boolean> {
    const allUserPRs = await onGetAllUserPRs();
    const allPRNumbers = allUserPRs.map((pr) => pr.number);
    return allPRNumbers.every((num) => $selectedPRs.includes(num));
  }

  // Pagination functions
  function goToPage(page: number) {
    if (page >= 1 && page <= $totalPages) {
      // Emit event to parent to load new page
      const event = new CustomEvent("pageChange", { detail: { page } });
      window.dispatchEvent(event);
    }
  }

  function goToPreviousPage() {
    if ($currentPage > 1) {
      goToPage($currentPage - 1);
    }
  }

  function goToNextPage() {
    if ($currentPage < $totalPages) {
      goToPage($currentPage + 1);
    }
  }
</script>

<div class="space-y-4">
  {#if $isLoading}
    <div class="space-y-3">
      {#each generateSkeletonItems(5) as _}
        <div class="bg-gray-100 rounded-lg p-4 animate-pulse">
          <div class="flex items-center space-x-3">
            <div class="w-4 h-4 bg-gray-200 rounded"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else if filteredPRs.length === 0}
    <div class="text-center py-8 text-gray-500">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        ></path>
      </svg>
      <p class="mt-2 text-sm">{t.no_prs_found}</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each filteredPRs as pr (pr.number)}
        <div
          class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedPRsMap.has(pr.number)}
              on:change={() => togglePRSelection(pr.number)}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-900 truncate">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hover:text-blue-600 transition-colors duration-200"
                  >
                    {pr.title}
                  </a>
                </h3>
                <span class="ml-2 text-xs text-gray-500">#{pr.number}</span>
              </div>
              <div class="mt-1 flex items-center space-x-2">
                <span class="text-xs text-gray-500">
                  {t.author}: {pr.user.login}
                </span>
                <span class="text-xs text-gray-400">•</span>
                <span class="text-xs text-gray-500">
                  {t.base_branch}: {pr.base.ref}
                </span>
                <span class="text-xs text-gray-400">•</span>
                <span class="text-xs text-gray-500">
                  {new Date(pr.created_at).toLocaleDateString()}
                </span>
              </div>
              {#if pr.labels && pr.labels.length > 0}
                <div class="mt-2 flex flex-wrap gap-1">
                  {#each pr.labels as label}
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style="background-color: #{label.color}20; color: #{label.color}"
                    >
                      {label.name}
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if $totalPages > 1}
      <div
        class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-0 mt-6"
      >
        <div class="flex flex-1 justify-between sm:hidden">
          <button
            on:click={goToPreviousPage}
            disabled={$currentPage <= 1}
            class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.previous}
          </button>
          <button
            on:click={goToNextPage}
            disabled={$currentPage >= $totalPages}
            class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.next}
          </button>
        </div>
        <div
          class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between"
        >
          <div>
            <p class="text-sm text-gray-700">
              {t.showing}
              <span class="font-medium"
                >{($currentPage - 1) * PER_PAGE + 1}</span
              >
              {t.to}
              <span class="font-medium"
                >{Math.min($currentPage * PER_PAGE, $totalPRs)}</span
              >
              {t.of} <span class="font-medium">{$totalPRs}</span>
              {t.results}
            </p>
          </div>
          <div>
            <nav
              class="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                on:click={goToPreviousPage}
                disabled={$currentPage <= 1}
                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">{t.previous}</span>
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>

              <!-- Page numbers -->
              {#each Array.from( { length: Math.min(5, $totalPages) }, (_, i) => {
                  const startPage = Math.max(1, $currentPage - 2);
                  const endPage = Math.min($totalPages, startPage + 4);
                  const adjustedStartPage = Math.max(1, endPage - 4);
                  return adjustedStartPage + i;
                } ).filter((page) => page <= $totalPages) as page}
                <button
                  on:click={() => goToPage(page)}
                  class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {page ===
                  $currentPage
                    ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}"
                >
                  {page}
                </button>
              {/each}

              <button
                on:click={goToNextPage}
                disabled={$currentPage >= $totalPages}
                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">{t.next}</span>
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
