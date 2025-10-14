<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { githubAPI } from "$lib/services/github-api";
  import { selectedPRs, updatePRs, prs, refreshLabels } from "$lib/stores";
  import Modal from "../../modal.svelte";
  import LabelSelector from "../../../labelSelector.svelte";
  import SelectedPRsList from "../selectedPRsList.svelte";
  import ProcessingState from "../processingState.svelte";
  import ResultsList from "../resultsList.svelte";
  import ModalFooter from "../modalFooter.svelte";

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
  {#if $selectedPRs.length === 0}
    <div class="text-center py-8">
      <p class="text-gray-500 text-lg">{t.select_pr_first}</p>
    </div>
  {:else if !isProcessing && !showResults}
    <SelectedPRsList
      selectedPRs={$selectedPRs}
      {isProcessing}
      onRemove={removePR}
    />

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

    <ModalFooter
      cancelText={t.cancel}
      confirmText={t.remove_labels}
      confirmDisabled={selectedLabels.length === 0}
      confirmVariant="danger"
      {isProcessing}
      onCancel={handleModalClose}
      onConfirm={handleConfirm}
    />
  {/if}

  <div slot="processing">
    {#if isProcessing}
      <ProcessingState
        currentItem={currentProcessingPR}
        processedCount={processingResults.length}
        totalCount={$selectedPRs.length}
        message={t.operation_in_progress}
        itemLabel={t.changing_pr}
      />
    {/if}
  </div>

  <div slot="results">
    {#if showResults}
      <ResultsList
        results={processingResults.map((r) => ({
          id: r.prNumber,
          success: r.success,
          error: r.error,
        }))}
        successMessage={t.operation_success}
        failureMessage={t.operation_failed}
        itemLabel="PR"
      />
      <ModalFooter
        showCancel={false}
        confirmText={t.confirm}
        onConfirm={handleModalClose}
      />
    {/if}
  </div>
</Modal>
