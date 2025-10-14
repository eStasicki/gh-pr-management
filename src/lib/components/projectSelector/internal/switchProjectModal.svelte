<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import type { Project } from "$lib/services/projectsService";

  export let isOpen = false;
  export let project: Project;

  const dispatch = createEventDispatcher();

  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  function handleClose() {
    dispatch("close");
  }

  function handleSwitchWithReload() {
    dispatch("switch", { reloadData: true });
  }

  function handleSwitchWithoutReload() {
    dispatch("switch", { reloadData: false });
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">
            {t.switch_project_title}
          </h3>
          <button
            on:click={handleClose}
            class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label="Zamknij modal"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="mb-6">
          <div class="p-4 bg-blue-50 rounded-lg mb-4">
            <p class="text-sm font-medium text-blue-800 mb-2">
              {t.switch_project_message}
            </p>
            <div class="text-sm text-blue-700">
              <span class="font-medium">{t.project_name}:</span>
              {project.project_name}
            </div>
            <div class="text-sm text-blue-600 mt-1">
              {project.repo_owner}/{project.repo_name}
            </div>
          </div>

          <div class="space-y-3">
            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="flex items-start">
                <svg
                  class="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-800">
                    {t.switch_and_reload}
                  </p>
                  <p class="text-xs text-gray-600 mt-1">
                    {t.switch_and_reload_description}
                  </p>
                </div>
              </div>
            </div>

            <div class="p-3 bg-gray-50 rounded-lg">
              <div class="flex items-start">
                <svg
                  class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-800">
                    {t.switch_only}
                  </p>
                  <p class="text-xs text-gray-600 mt-1">
                    {t.switch_only_description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <button
            on:click={handleSwitchWithReload}
            class="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
          >
            {t.switch_and_reload}
          </button>
          <button
            on:click={handleSwitchWithoutReload}
            class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            {t.switch_only}
          </button>
          <button
            on:click={handleClose}
            class="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
