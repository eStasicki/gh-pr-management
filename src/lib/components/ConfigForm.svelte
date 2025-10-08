<script lang="ts">
  import {
    config,
    tokenHistory,
    addTokenToHistory,
    validateAuth,
    auth,
  } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import ConnectionLostModal from "./modals/ConnectionLostModal.svelte";
  import {
    createDropdownHandlers,
    createClickOutsideHandlerWithSelector,
  } from "$lib/utils/uiUtils";

  let t = translations.pl;
  let token = "";
  let owner = "";
  let repo = "";
  let enterpriseUrl = "";
  let showTokenDropdown = false;
  let selectedTokenId = "";

  $: if (browser) {
    t = translations[$language];
  }

  const dropdownHandlers = createDropdownHandlers();
  let clickOutsideHandler: ReturnType<
    typeof createClickOutsideHandlerWithSelector
  >;

  onMount(() => {
    if (browser) {
      const currentConfig = get(config);
      token = currentConfig.token || "";
      owner = currentConfig.owner || "";
      repo = currentConfig.repo || "";
      enterpriseUrl = currentConfig.enterpriseUrl || "";
    }

    clickOutsideHandler = createClickOutsideHandlerWithSelector(
      ".token-dropdown-container",
      () => {
        showTokenDropdown = dropdownHandlers.closeDropdown();
      }
    );
    clickOutsideHandler.addEventListener();

    return () => {
      clickOutsideHandler.removeEventListener();
    };
  });

  function selectToken(tokenItem: any) {
    token = tokenItem.token;
    selectedTokenId = tokenItem.id;
    showTokenDropdown = dropdownHandlers.closeDropdown();
  }

  function handleTokenInput() {
    showTokenDropdown = dropdownHandlers.closeDropdown();
    selectedTokenId = "";
  }

  async function saveConfig() {
    if (!token || !owner || !repo) {
      alert(t.enter_base_branch);
      return;
    }

    addTokenToHistory(token);

    config.set({
      token,
      owner,
      repo,
      enterpriseUrl,
    });

    // Force immediate validation after config is saved
    try {
      await validateAuth(true);
    } catch (error) {
      // The auth store will handle showing the modal if validation fails
    }
  }
</script>

<div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
  <h2 class="text-2xl font-bold text-gray-800 mb-6">
    {t.config_title}
  </h2>

  <div class="space-y-6">
    <div class="relative token-dropdown-container">
      <label
        for="github-token"
        class="block text-sm font-semibold text-gray-700 mb-2"
      >
        {t.github_token_label}
      </label>
      <div class="relative">
        <input
          type="password"
          id="github-token"
          bind:value={token}
          on:input={handleTokenInput}
          on:focus={() => (showTokenDropdown = $tokenHistory.length > 0)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          class="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
        />
        {#if $tokenHistory.length > 0}
          <button
            type="button"
            on:click={() => (showTokenDropdown = !showTokenDropdown)}
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Show token history"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        {/if}
      </div>

      {#if showTokenDropdown && $tokenHistory.length > 0}
        <div
          class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {#each $tokenHistory as tokenItem}
            <button
              type="button"
              on:click={() => selectToken(tokenItem)}
              class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div class="font-medium text-gray-900">{tokenItem.label}</div>
              <div class="text-sm text-gray-500">
                {tokenItem.token.substring(0, 8)}...
              </div>
            </button>
          {/each}
        </div>
      {/if}

      <small class="text-gray-500 text-sm mt-1">
        {t.github_token_help}
      </small>
      <div
        class="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700"
      >
        {t.token_security_warning}
      </div>
    </div>

    <div>
      <label
        for="repo-owner"
        class="block text-sm font-semibold text-gray-700 mb-2"
      >
        {t.repo_owner_label}
      </label>
      <input
        type="text"
        id="repo-owner"
        bind:value={owner}
        placeholder="username"
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
      />
    </div>

    <div>
      <label
        for="repo-name"
        class="block text-sm font-semibold text-gray-700 mb-2"
      >
        {t.repo_name_label}
      </label>
      <input
        type="text"
        id="repo-name"
        bind:value={repo}
        placeholder="repository-name"
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
      />
    </div>

    <div>
      <label
        for="github-enterprise-url"
        class="block text-sm font-semibold text-gray-700 mb-2"
      >
        {t.github_enterprise_url_label}
      </label>
      <input
        type="text"
        id="github-enterprise-url"
        bind:value={enterpriseUrl}
        placeholder="https://github.company.com"
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
      />
      <small class="text-gray-500 text-sm mt-1">
        {t.github_enterprise_url_help}
      </small>
    </div>

    <button
      on:click={saveConfig}
      class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700"
    >
      {t.save_config}
    </button>
  </div>
</div>

<ConnectionLostModal bind:isOpen={$auth.showConnectionLostModal} />
