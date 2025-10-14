<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { githubAPI } from "$lib/services/github-api";
  import { selectedPRs, updatePRs, prs, refreshLabels } from "$lib/stores";
  import Modal from "../../modal.svelte";
  import LabelSelector from "../../../LabelSelector.svelte";
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

  async function convertStringLabelsToGitHubLabels(labelNames: string[]) {
    try {
      const allLabels = await githubAPI.getLabels();
      return labelNames.map((name) => {
        const existingLabel = allLabels.find((label) => label.name === name);
        return {
          id: Math.random(), // GitHub API doesn't return ID for labels
          name: name,
          color: existingLabel?.color || "e0e0e0",
          description: "",
        };
      });
    } catch (error) {
      return labelNames.map((name) => ({
        id: Math.random(),
        name: name,
        color: "e0e0e0",
        description: "",
      }));
    }
  }

  async function processPRs() {
    isProcessing = true;
    processingResults = [];
    showResults = false;

    for (let i = 0; i < $selectedPRs.length; i++) {
      const prNumber = $selectedPRs[i];
      currentProcessingPR = prNumber;

      try {
        await githubAPI.addLabelsToPR(prNumber, selectedLabels);
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
      const newLabelsData =
        await convertStringLabelsToGitHubLabels(selectedLabels);

      successfulPRs.forEach((prNumber) => {
        const currentLabels = getCurrentLabels(prNumber);
        const currentLabelNames = currentLabels.map((label) => label.name);

        // Filter out labels that already exist
        const labelsToAdd = newLabelsData.filter(
          (newLabel) => !currentLabelNames.includes(newLabel.name)
        );

        const newLabels = [...currentLabels, ...labelsToAdd];

        updatePRs([prNumber], {
          labels: newLabels,
        });
      });

      // Refresh labels in the global store
      await refreshLabels();
    }
  }
</script>

<Modal
  bind:isOpen
  title="{t.add_labels} ({$selectedPRs.length})"
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
        {t.add_labels_help}
      </p>
    </div>

    <ModalFooter
      cancelText={t.cancel}
      confirmText={t.add_labels}
      confirmDisabled={selectedLabels.length === 0}
      confirmVariant="success"
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
