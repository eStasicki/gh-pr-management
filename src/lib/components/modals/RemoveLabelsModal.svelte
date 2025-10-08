<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { githubAPI } from "$lib/services/github-api";
  import { selectedPRs, updatePRs, prs, refreshLabels } from "$lib/stores";
  import Modal from "../Modal.svelte";
  import LabelSelector from "../LabelSelector.svelte";

  export let isOpen = false;
  export let onClose: () => void;

  let t = translations.pl;
  let selectedLabels: string[] = [];
  let isProcessing = false;
  let currentProcessingPR = 0;
  let processingResults: Array<{
    prNumber: number;
    success: boolean;
    error?: string;
  }> = [];
  let showResults = false;

  $: if (browser) {
    t = translations[$language];
  }

  $: if (isOpen && $selectedPRs.length === 0) {
    handleModalClose();
  }

  // Refresh labels when modal opens
  $: if (isOpen) {
    refreshLabels();
  }

  function handleConfirm() {
    if (selectedLabels.length > 0 && $selectedPRs.length > 0) {
      processPRs();
    }
  }

  function handleLabelsChange(labels: string[]) {
    selectedLabels = labels;
  }

  async function handleModalClose() {
    if (!isProcessing) {
      selectedLabels = [];
      processingResults = [];
      showResults = false;

      // Refresh labels when closing modal to ensure fresh data next time
      await refreshLabels();

      onClose();
    }
  }

  function removePR(prNumber: number) {
    if (!isProcessing) {
      selectedPRs.set($selectedPRs.filter((num) => num !== prNumber));
    }
  }

  function getCurrentLabels(prNumber: number) {
    const currentPRs = $prs;
    const pr = currentPRs.find((p) => p.number === prNumber);
    return pr ? pr.labels : [];
  }

  function getAvailableLabelsForPR(prNumber: number) {
    const currentLabels = getCurrentLabels(prNumber);
    return currentLabels.map((label) => label.name);
  }

  function getCommonLabels() {
    if ($selectedPRs.length === 0) return [];

    const allLabels = $selectedPRs.map((prNumber) =>
      getAvailableLabelsForPR(prNumber)
    );
    if (allLabels.length === 0) return [];

    return allLabels.reduce((common, labels) =>
      common.filter((label) => labels.includes(label))
    );
  }

  async function processPRs() {
    isProcessing = true;
    processingResults = [];
    showResults = false;

    for (let i = 0; i < $selectedPRs.length; i++) {
      const prNumber = $selectedPRs[i];
      currentProcessingPR = prNumber;

      try {
        const availableLabels = getAvailableLabelsForPR(prNumber);
        const labelsToRemove = selectedLabels.filter((label) =>
          availableLabels.includes(label)
        );

        if (labelsToRemove.length > 0) {
          await githubAPI.removeLabelsFromPR(prNumber, labelsToRemove);
        }

        processingResults.push({ prNumber, success: true });
      } catch (error) {
        processingResults.push({
          prNumber,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    isProcessing = false;
    showResults = true;

    const successfulPRs = processingResults
      .filter((result) => result.success)
      .map((result) => result.prNumber);

    if (successfulPRs.length > 0) {
      successfulPRs.forEach((prNumber) => {
        const currentLabels = getCurrentLabels(prNumber);
        const updatedLabels = currentLabels.filter(
          (label) => !selectedLabels.includes(label.name)
        );

        updatePRs([prNumber], {
          labels: updatedLabels,
        });
      });

      // Refresh labels in the global store
      await refreshLabels();
    }
  }
</script>

<Modal
  bind:isOpen
  title="{t.remove_labels} ({$selectedPRs.length})"
  maxWidth="max-w-2xl"
  on:close={handleModalClose}
>
  <div class="space-y-6">
    {#if $selectedPRs.length === 0}
      <div class="text-center py-8">
        <p class="text-gray-500 text-lg">{t.select_pr_first}</p>
      </div>
    {:else}
      <div class="space-y-4">
        <div>
          <h4 class="text-sm font-semibold text-gray-700 mb-2">
            {t.selected_prs}:
          </h4>
          <div
            class="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3"
          >
            <div class="flex flex-wrap gap-2">
              {#each $selectedPRs as prNumber}
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  #{prNumber}
                  {#if !isProcessing}
                    <button
                      on:click={() => removePR(prNumber)}
                      class="ml-2 text-blue-600 hover:text-blue-800"
                      aria-label="Remove PR {prNumber}"
                    >
                      <svg
                        class="w-3 h-3"
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
                  {/if}
                </span>
              {/each}
            </div>
          </div>
        </div>

        <div>
          <LabelSelector {selectedLabels} onLabelsChange={handleLabelsChange} />
          <p class="text-sm text-gray-500 mt-2">
            {t.remove_labels_help}
          </p>
        </div>

        {#if getCommonLabels().length > 0}
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-2">
              {t.common_labels}:
            </h4>
            <div class="flex flex-wrap gap-2">
              {#each getCommonLabels() as labelName}
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                  style="background-color: #e0e0e0;"
                >
                  {labelName}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      {#if isProcessing}
        <div class="text-center">
          <div class="mb-4">
            <div
              class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            ></div>
          </div>
          <p class="text-lg font-semibold text-gray-700 mb-2">
            {t.operation_in_progress}
          </p>
          <p class="text-sm text-gray-600 mb-4">
            {t.changing_pr} #{currentProcessingPR}
          </p>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style="width: {(processingResults.length / $selectedPRs.length) *
                100}%"
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            {processingResults.length} / {$selectedPRs.length}
          </p>
        </div>
      {/if}

      {#if showResults}
        <div class="mb-4">
          <h4 class="text-lg font-semibold text-gray-800 mb-3">
            {processingResults.filter((r) => r.success).length ===
            processingResults.length
              ? t.operation_success
              : t.operation_failed}
          </h4>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            {#each processingResults as result}
              <div
                class="flex items-center justify-between p-2 rounded {result.success
                  ? 'bg-green-50'
                  : 'bg-red-50'}"
              >
                <span class="text-sm font-medium">
                  PR #{result.prNumber}
                </span>
                <div class="flex items-center gap-2">
                  {#if result.success}
                    <svg
                      class="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    <span class="text-sm text-green-600 font-medium">OK</span>
                  {:else}
                    <svg
                      class="w-4 h-4 text-red-600"
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
                    <span class="text-sm text-red-600 font-medium">Error</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {#if !showResults}
          <button
            on:click={handleModalClose}
            disabled={isProcessing}
            class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.cancel}
          </button>
        {/if}
        <button
          on:click={showResults ? handleModalClose : handleConfirm}
          disabled={isProcessing ||
            (!showResults && selectedLabels.length === 0)}
          class="px-4 py-2 {showResults
            ? 'bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700'
            : 'bg-red-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showResults ? t.confirm : t.remove_labels}
        </button>
      </div>
    {/if}
  </div>
</Modal>
