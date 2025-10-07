<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { githubAPI } from "$lib/services/github-api";
  import { selectedPRs, updatePRs, prs } from "$lib/stores";
  import Modal from "../Modal.svelte";
  import BranchSelector from "../BranchSelector.svelte"; // Single-select branch picker
  import LabelSelector from "../LabelSelector.svelte"; // Multi-select label picker

  export let isOpen = false;
  export let onClose: () => void;

  let t = translations.pl;
  let baseBranch = "";
  let addLabels = false;
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

  // Auto-close modal if no PRs are selected
  $: if (isOpen && $selectedPRs.length === 0) {
    handleModalClose();
  }

  function handleConfirm() {
    if (baseBranch.trim() && $selectedPRs.length > 0) {
      processPRs();
    }
  }

  function handleBranchSelect(branch: string) {
    baseBranch = branch;
  }

  function handleLabelsChange(labels: string[]) {
    selectedLabels = labels;
  }

  function handleModalClose() {
    if (!isProcessing) {
      baseBranch = "";
      addLabels = false;
      selectedLabels = [];
      processingResults = [];
      showResults = false;
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

  function convertStringLabelsToGitHubLabels(labelNames: string[]) {
    // This is a simplified conversion - in a real app you'd want to fetch full label data
    return labelNames.map((name) => ({
      id: Math.random(), // Temporary ID
      name: name,
      color: "e0e0e0", // Default color
      description: "",
    }));
  }

  async function processPRs() {
    isProcessing = true;
    processingResults = [];
    showResults = false;

    for (let i = 0; i < $selectedPRs.length; i++) {
      const prNumber = $selectedPRs[i];
      currentProcessingPR = prNumber;

      try {
        await githubAPI.updatePRBase(prNumber, baseBranch.trim());

        // Add labels if enabled and selected
        if (addLabels && selectedLabels.length > 0) {
          await githubAPI.addLabelsToPR(prNumber, selectedLabels);
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

    // Update only the affected PRs in the store (smooth update without loader)
    const successfulPRs = processingResults
      .filter((result) => result.success)
      .map((result) => result.prNumber);

    if (successfulPRs.length > 0) {
      // Update each PR individually to preserve their existing labels
      successfulPRs.forEach((prNumber) => {
        const currentLabels = getCurrentLabels(prNumber);
        const newLabels =
          addLabels && selectedLabels.length > 0
            ? [
                ...currentLabels,
                ...convertStringLabelsToGitHubLabels(selectedLabels),
              ]
            : currentLabels;

        updatePRs([prNumber], {
          base: { ref: baseBranch.trim() },
          labels: newLabels,
        });
      });
    }
  }
</script>

<Modal
  bind:isOpen
  title="{t.change_selected_base} ({$selectedPRs.length})"
  on:close={handleModalClose}
>
  {#if !isProcessing && !showResults}
    <div class="mb-4">
      <div class="block text-sm font-semibold text-gray-700 mb-2">
        {t.selected_prs}:
      </div>
      <div class="bg-gray-50 p-3 rounded-lg mb-4">
        <div class="flex flex-wrap gap-2">
          {#each $selectedPRs as prNumber}
            <div
              class="group relative bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
            >
              #{prNumber}
              <button
                on:click={() => removePR(prNumber)}
                class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                aria-label="Remove PR #{prNumber}"
              >
                <svg
                  class="w-2 h-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="mb-4">
      <BranchSelector
        bind:selectedBranch={baseBranch}
        onBranchSelect={handleBranchSelect}
      />
    </div>

    <div class="mb-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={addLabels}
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
        <span class="text-sm font-medium text-gray-700">
          {t.add_labels_to_prs}
        </span>
      </label>
    </div>

    {#if addLabels}
      <div class="mb-4">
        <LabelSelector
          bind:selectedLabels
          onLabelsChange={handleLabelsChange}
        />
      </div>
    {/if}

    <div class="flex gap-3 justify-end">
      <button
        on:click={handleModalClose}
        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-300"
      >
        {t.cancel}
      </button>
      <button
        on:click={handleConfirm}
        disabled={!baseBranch.trim() || $selectedPRs.length === 0}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {t.confirm}
      </button>
    </div>
  {/if}

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

    <div class="flex gap-3 justify-end">
      <button
        on:click={handleModalClose}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700"
      >
        {t.confirm}
      </button>
    </div>
  {/if}
</Modal>
