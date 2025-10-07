<script lang="ts">
  import { onMount } from "svelte";
  import { config, currentUser, prs, isLoading } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import PRList from "./PRList.svelte";
  import ActionsPanel from "./ActionsPanel.svelte";

  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  onMount(() => {
    loadUser();
    loadPRs();
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

  async function loadPRs() {
    isLoading.set(true);
    try {
      const allPRs = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const response = await fetch(
          `${getApiBaseUrl()}/repos/${$config.owner}/${$config.repo}/pulls?state=open&page=${page}&per_page=${perPage}`,
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

        const prs = await response.json();
        if (prs.length === 0) break;

        const openPRs = prs.filter(
          (pr: any) => pr.state === "open" && !pr.merged_at
        );
        allPRs.push(...openPRs);

        if (prs.length < perPage) break;
        page++;
      }

      prs.set(allPRs);
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
  }
</script>

<div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
  <div class="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
    <span class="text-gray-700">{t.logged_as}</span>
    <strong class="text-primary-600">
      {$currentUser?.login}
      {#if $currentUser?.name}
        ({$currentUser.name})
      {/if}
    </strong>
    <button
      on:click={logout}
      class="ml-auto bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-300 hover:-translate-y-0.5 shadow-md"
    >
      {t.logout}
    </button>
  </div>

  <div class="mb-8">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">
        {t.my_prs}
      </h2>
      <div
        class="text-sm text-gray-600 font-medium px-3 py-2 bg-primary-100 rounded-lg"
      >
        <span>{t.secure_mode}</span>
      </div>
    </div>

    <div class="flex gap-4 mb-6 items-center">
      <input
        type="text"
        placeholder={t.search_prs}
        class="flex-1 max-w-sm px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
      />
      <div
        class="text-sm text-gray-600 font-medium px-3 py-2 bg-gray-100 rounded-lg"
      >
        {#if $isLoading}
          {t.loading}
        {:else}
          Showing {$prs.length} PRs
        {/if}
      </div>
      <button
        on:click={loadPRs}
        class="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-300 hover:-translate-y-0.5 shadow-md"
      >
        {t.refresh}
      </button>
    </div>

    <PRList />
  </div>

  <ActionsPanel />
</div>
