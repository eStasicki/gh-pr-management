<script lang="ts">
  import {
    config,
    tokenHistory,
    addTokenToHistory,
    validateAuth,
    auth,
    loadConfigFromSupabase,
    saveConfigToSupabase,
    admin,
    currentProject,
  } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import ConnectionLostModal from "./modal/internal/modals/connectionLostModal.svelte";
  import {
    createDropdownHandlers,
    createClickOutsideHandlerWithSelector,
  } from "$lib/utils/uiUtils";
  import {
    enableDemoMode,
    disableDemoMode,
    isDemoMode,
  } from "$lib/utils/demoMode";

  let t = translations.pl;
  let token = "";
  let owner = "";
  let repo = "";
  let enterpriseUrl = "";
  let useEnterprise = false;
  let requiresVpn = false;
  let showTokenDropdown = false;
  let selectedTokenId = "";
  let isLoading = false;
  let isSaving = false;
  let errorMessage = "";
  let successMessage = "";

  $: if (browser) {
    t = translations[$language];
  }

  const dropdownHandlers = createDropdownHandlers();
  let clickOutsideHandler: ReturnType<
    typeof createClickOutsideHandlerWithSelector
  >;

  onMount(() => {
    if (browser) {
      loadFormData();
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

  // Reactive statement to reload form data when currentProject changes
  $: if ($currentProject && browser) {
    loadFormData();
  }

  async function loadFormData() {
    isLoading = true;
    try {
      const supabaseConfig = await loadConfigFromSupabase();
      if (supabaseConfig.token) {
        token = supabaseConfig.token;
        owner = supabaseConfig.owner;
        repo = supabaseConfig.repo;
        enterpriseUrl = supabaseConfig.enterpriseUrl;
        useEnterprise = !!supabaseConfig.enterpriseUrl;
        requiresVpn = supabaseConfig.requiresVpn || false;
      } else {
        // Fallback to local store
        const currentConfig = get(config);
        token = currentConfig.token || "";
        owner = currentConfig.owner || "";
        repo = currentConfig.repo || "";
        enterpriseUrl = currentConfig.enterpriseUrl || "";
        useEnterprise = !!currentConfig.enterpriseUrl;
        requiresVpn = currentConfig.requiresVpn || false;
      }
    } catch (error) {
      errorMessage = t.settings_loading_error;
      const currentConfig = get(config);
      token = currentConfig.token || "";
      owner = currentConfig.owner || "";
      repo = currentConfig.repo || "";
      enterpriseUrl = currentConfig.enterpriseUrl || "";
      useEnterprise = !!currentConfig.enterpriseUrl;
      requiresVpn = currentConfig.requiresVpn || false;
    } finally {
      isLoading = false;
    }
  }

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
      errorMessage = t.enter_base_branch;
      return;
    }

    isSaving = true;
    errorMessage = "";
    successMessage = "";

    try {
      // Save to Supabase
      await saveConfigToSupabase({
        token,
        owner,
        repo,
        enterpriseUrl: useEnterprise ? enterpriseUrl : "",
        requiresVpn,
      });

      // Save locally as backup
      addTokenToHistory(token);
      config.set({
        token,
        owner,
        repo,
        enterpriseUrl: useEnterprise ? enterpriseUrl : "",
        requiresVpn,
      });

      // Validation
      await validateAuth(true);

      successMessage = t.settings_saved_success;
    } catch (error) {
      errorMessage = t.settings_save_error;
    } finally {
      isSaving = false;
    }
  }

  async function toggleDemoMode() {
    try {
      if (isDemoMode()) {
        await disableDemoMode();
        successMessage = t.demo_mode_disabled;
      } else {
        await enableDemoMode();
        successMessage = t.demo_mode_enabled;
      }

      // Clear message after 3 seconds
      setTimeout(() => {
        successMessage = "";
      }, 3000);
    } catch (error) {
      errorMessage = t.demo_mode_error;
    }
  }
</script>

<div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
  {#if errorMessage || successMessage}
    <div class="mb-6">
      {#if errorMessage}
        <div
          class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          {errorMessage}
        </div>
      {/if}

      {#if successMessage}
        <div
          class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
        >
          {successMessage}
        </div>
      {/if}
    </div>
  {/if}

  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold text-gray-800">
      {t.config_title}
    </h2>
    {#if $currentProject}
      <div class="text-sm text-gray-600">
        <span class="font-medium">{t.current_project}:</span>
        <span class="text-blue-600 font-semibold">
          {$currentProject.project_name}
        </span>
      </div>
    {/if}
  </div>

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
      <div class="flex items-center mb-4">
        <input
          type="checkbox"
          id="use-enterprise"
          bind:checked={useEnterprise}
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          for="use-enterprise"
          class="ml-2 block text-sm font-semibold text-gray-700"
        >
          {t.use_enterprise}
        </label>
      </div>

      {#if useEnterprise}
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
      {/if}
    </div>

    <div class="flex items-center">
      <input
        type="checkbox"
        id="requires-vpn"
        bind:checked={requiresVpn}
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label
        for="requires-vpn"
        class="ml-2 block text-sm font-semibold text-gray-700"
      >
        {t.requires_vpn}
      </label>
    </div>

    {#if $admin.isAdmin}
      <div class="border-t pt-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">{t.demo_mode}</h3>
        <p class="text-sm text-gray-600 mb-4">
          {t.demo_mode_description}
        </p>
        <button
          on:click={toggleDemoMode}
          class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-purple-700"
        >
          {isDemoMode() ? t.disable_demo : t.enable_demo}
        </button>
      </div>
    {/if}

    <button
      on:click={saveConfig}
      disabled={isSaving || isLoading}
      class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if isSaving}
        <span class="flex items-center justify-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Zapisywanie...
        </span>
      {:else}
        {t.save_config}
      {/if}
    </button>
  </div>
</div>

{#if isLoading}
  <div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
    <div class="flex items-center justify-center">
      <svg
        class="animate-spin h-8 w-8 text-blue-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span class="ml-3 text-gray-600">{t.loading_settings}</span>
    </div>
  </div>
{/if}

<ConnectionLostModal bind:isOpen={$auth.showConnectionLostModal} />
