<script lang="ts">
  import { config } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";

  let t = translations.pl;
  let token = "";
  let owner = "";
  let repo = "";
  let enterpriseUrl = "";

  $: if (browser) {
    t = translations[$language];
  }

  function saveConfig() {
    if (!token || !owner || !repo) {
      alert(t.enter_base_branch);
      return;
    }

    config.set({
      token,
      owner,
      repo,
      enterpriseUrl,
    });
  }
</script>

<div class="bg-white rounded-2xl p-8 mb-6 shadow-2xl">
  <h2 class="text-2xl font-bold text-gray-800 mb-6">
    {t.config_title}
  </h2>

  <div class="space-y-6">
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
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
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
