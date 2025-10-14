<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import Modal from "../../modal/modal.svelte";
  import ModalFooter from "../../modal/internal/modalFooter.svelte";

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  let t = translations.pl;
  let projectName = "";
  let token = "";
  let owner = "";
  let repo = "";
  let enterpriseUrl = "";
  let useEnterprise = false;
  let requiresVpn = false;
  let errorMessage = "";

  $: if (browser) {
    t = translations[$language];
  }

  function handleClose() {
    projectName = "";
    token = "";
    owner = "";
    repo = "";
    enterpriseUrl = "";
    useEnterprise = false;
    requiresVpn = false;
    errorMessage = "";
    dispatch("close");
  }

  function handleCreate() {
    errorMessage = "";

    if (!projectName.trim()) {
      errorMessage = t.project_name_required;
      return;
    }

    if (projectName.length > 100) {
      errorMessage = t.project_name_too_long;
      return;
    }

    if (!token.trim() || !owner.trim() || !repo.trim()) {
      errorMessage = t.enter_base_branch;
      return;
    }

    dispatch("create", {
      projectName: projectName.trim(),
      config: {
        github_token: token.trim(),
        repo_owner: owner.trim(),
        repo_name: repo.trim(),
        enterprise_url: useEnterprise ? enterpriseUrl.trim() : "",
        requires_vpn: requiresVpn,
        demo_mode: false,
      },
    });
  }
</script>

<Modal
  bind:isOpen
  title={t.add_new_project}
  maxWidth="max-w-2xl"
  on:close={handleClose}
>
  {#if errorMessage}
    <div
      class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
    >
      {errorMessage}
    </div>
  {/if}

  <div class="space-y-4">
    <div>
      <label
        for="project-name"
        class="block text-sm font-semibold text-gray-700 mb-2"
      >
        {t.project_name}:
      </label>
      <input
        id="project-name"
        type="text"
        bind:value={projectName}
        placeholder={t.project_name_placeholder}
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>

    <div>
      <label
        for="github-token"
        class="block text-sm font-semibold text-gray-700 mb-2"
      >
        {t.github_token_label}
      </label>
      <input
        type="password"
        id="github-token"
        bind:value={token}
        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
      <small class="text-gray-500 text-sm mt-1">
        {t.github_token_help}
      </small>
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
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
  </div>

  <ModalFooter
    cancelText={t.cancel}
    confirmText={t.add_new_project}
    confirmDisabled={!projectName.trim() ||
      !token.trim() ||
      !owner.trim() ||
      !repo.trim()}
    confirmVariant="success"
    onCancel={handleClose}
    onConfirm={handleCreate}
  />
</Modal>
