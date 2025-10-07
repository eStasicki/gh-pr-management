<script lang="ts">
  import { onMount } from "svelte";
  import {
    config,
    currentUser,
    prs,
    isLoading,
    currentPage,
    totalPages,
    totalPRs,
    searchTerm,
    selectedPRs,
  } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import PRList from "./PRList.svelte";
  import ActionsPanel from "./ActionsPanel.svelte";

  let t = translations.pl;
  let prListComponent: any;
  let actionsDropdown: HTMLElement;
  let actionsDropdownOpen = false;

  $: if (browser) {
    t = translations[$language];
  }

  onMount(() => {
    loadUser().then(() => {
      loadPRs(1);
      // Load all user PRs for proper state management
      getAllUserPRs();
    });

    // Listen for page change events from PRList
    const handleLoadPRs = (event: Event) => {
      const customEvent = event as CustomEvent;
      loadPRs(customEvent.detail.page);
    };

    // Listen for get all user PRs events from PRList
    const handleGetAllUserPRs = async (event: Event) => {
      const allUserPRs = await getAllUserPRs();
      window.dispatchEvent(
        new CustomEvent("allUserPRsResponse", { detail: { prs: allUserPRs } })
      );
    };

    window.addEventListener("loadPRs", handleLoadPRs);
    window.addEventListener("getAllUserPRs", handleGetAllUserPRs);

    // Add click outside listener for dropdown
    document.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("loadPRs", handleLoadPRs);
      window.removeEventListener("getAllUserPRs", handleGetAllUserPRs);
      document.removeEventListener("click", handleClickOutside);
    };
  });

  async function loadUser() {
    try {
      const response = await fetch(`${getApiBaseUrl()}/user`, {
        headers: {
          Authorization: `token ${$config.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.ok) {
        const user = await response.json();
        currentUser.set(user);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }

  async function loadPRs(page: number = 1) {
    if (!$currentUser?.login) {
      console.error("No current user available");
      return;
    }

    isLoading.set(true);
    try {
      const perPage = 20;
      let searchQuery = `repo:${$config.owner}/${$config.repo} is:pr is:open author:${$currentUser.login}`;

      // Add search term to query if provided
      if ($searchTerm.trim()) {
        searchQuery += ` ${$searchTerm}`;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/search/issues?q=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `token ${$config.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const searchResult = await response.json();
      const searchItems = searchResult.items || [];

      // Convert search results to PR format
      const prsData = await Promise.all(
        searchItems.map(async (item: any) => {
          const prResponse = await fetch(
            `${getApiBaseUrl()}/repos/${$config.owner}/${$config.repo}/pulls/${item.number}`,
            {
              headers: {
                Authorization: `token ${$config.token}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          if (prResponse.ok) {
            return await prResponse.json();
          }
          return null;
        })
      );

      const validPRs = prsData.filter((pr) => pr !== null);
      prs.set(validPRs);
      currentPage.set(page);

      // Calculate total pages based on total count
      const totalCount = searchResult.total_count || 0;
      const totalPagesCount = Math.ceil(totalCount / perPage);
      totalPages.set(totalPagesCount);
      totalPRs.set(totalCount);

      // Load all user PRs in background for proper state management
      getAllUserPRs();
    } catch (error) {
      console.error("Error loading PRs:", error);
    } finally {
      isLoading.set(false);
    }
  }

  function getApiBaseUrl() {
    if ($config.enterpriseUrl) {
      return $config.enterpriseUrl.replace(/\/$/, "") + "/api/v3";
    }
    return "https://api.github.com";
  }

  function logout() {
    config.set({
      token: "",
      owner: "",
      repo: "",
      enterpriseUrl: "",
    });

    // Clear selected PRs from localStorage on logout
    if (browser) {
      localStorage.removeItem("selectedPRs");
      selectedPRs.set([]);
    }
  }

  // Reactive state for all PRs selected
  let allPRsSelected = false;
  let allUserPRs: any[] = [];

  // Update allPRsSelected when selectedPRs or allUserPRs change
  $: {
    if (allUserPRs.length > 0) {
      // Check if all PRs from current search are selected
      const allSearchPRNumbers = allUserPRs.map((pr) => pr.number);
      allPRsSelected =
        allSearchPRNumbers.length > 0 &&
        allSearchPRNumbers.every((num) => $selectedPRs.includes(num));
    } else {
      allPRsSelected = false;
    }
  }

  // Validate selectedPRs against current search results
  $: if (allUserPRs.length > 0) {
    const allSearchPRNumbers = allUserPRs.map((pr) => pr.number);
    const validSelectedPRs = $selectedPRs.filter((prNumber) =>
      allSearchPRNumbers.includes(prNumber)
    );

    // Update selectedPRs if some PRs are no longer in current search
    if (validSelectedPRs.length !== $selectedPRs.length) {
      selectedPRs.set(validSelectedPRs);
    }
  }

  // Refresh all user PRs when search term changes
  $: if ($searchTerm !== undefined) {
    getAllUserPRs();
  }

  function toggleActionsDropdown() {
    actionsDropdownOpen = !actionsDropdownOpen;
  }

  function closeActionsDropdown() {
    actionsDropdownOpen = false;
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (actionsDropdown && !actionsDropdown.contains(event.target as Node)) {
      closeActionsDropdown();
    }
  }

  async function getAllUserPRs() {
    if (!$currentUser?.login) {
      console.error("No current user available");
      return [];
    }

    try {
      const allPRs = [];
      let page = 1;
      const perPage = 100; // Use larger page size for efficiency

      while (true) {
        const searchQuery = `repo:${$config.owner}/${$config.repo} is:pr is:open author:${$currentUser.login}${$searchTerm ? ` ${$searchTerm}` : ""}`;

        const response = await fetch(
          `${getApiBaseUrl()}/search/issues?q=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`,
          {
            headers: {
              Authorization: `token ${$config.token}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const searchResult = await response.json();
        const prsData = searchResult.items || [];

        if (prsData.length === 0) break;

        // Convert search results to PR format
        const prs = await Promise.all(
          prsData.map(async (item: any) => {
            const prResponse = await fetch(
              `${getApiBaseUrl()}/repos/${$config.owner}/${$config.repo}/pulls/${item.number}`,
              {
                headers: {
                  Authorization: `token ${$config.token}`,
                  Accept: "application/vnd.github.v3+json",
                },
              }
            );

            if (prResponse.ok) {
              return await prResponse.json();
            }
            return null;
          })
        );

        const validPRs = prs.filter((pr) => pr !== null);
        allPRs.push(...validPRs);

        if (prsData.length < perPage) break;
        page++;
      }

      allUserPRs = allPRs;

      // Trigger reactive statement update
      allUserPRs = [...allUserPRs];

      return allPRs;
    } catch (error) {
      console.error("Error loading all user PRs:", error);
      allUserPRs = [];
      return [];
    }
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

      <!-- Actions Dropdown -->
      <div class="relative w-full lg:w-auto" bind:this={actionsDropdown}>
        <button
          on:click={toggleActionsDropdown}
          class="bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-600 flex items-center gap-2 w-full lg:w-auto"
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
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
            ></path>
          </svg>
          {t.actions}
          <svg
            class="w-4 h-4 transition-transform duration-200 absolute right-4 lg:right-0 lg:relative {actionsDropdownOpen
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

        {#if actionsDropdownOpen}
          <div
            class="absolute right-0 mt-2 w-full lg:w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
          >
            <div class="py-1">
              <button
                on:click={() => {
                  prListComponent?.toggleAllPRs();
                  actionsDropdownOpen = false;
                }}
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {allPRsSelected ? t.deselect_all : t.select_all}
              </button>
              <button
                on:click={() => {
                  loadPRs($currentPage);
                  actionsDropdownOpen = false;
                }}
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                {t.refresh}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if $selectedPRs.length > 0}
      <div class="text-sm text-gray-500 mb-6">
        <span class="text-primary-600 font-semibold">
          {t.selected}: {$selectedPRs.length}
        </span>
      </div>
    {/if}

    <PRList bind:this={prListComponent} />
  </div>

  <ActionsPanel />
</div>
