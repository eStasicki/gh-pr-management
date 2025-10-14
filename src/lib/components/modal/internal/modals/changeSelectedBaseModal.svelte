<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { githubAPI } from "$lib/services/github-api";
  import {
    selectedPRs,
    updatePRs,
    prs,
    validateAuth,
    refreshLabels,
  } from "$lib/stores";
  import Modal from "../../modal.svelte";
  import BranchSelector from "../../../branchSelector.svelte";
  import LabelSelector from "../../../labelSelector.svelte";
  import SelectedPRsList from "../selectedPRsList.svelte";
  import ProcessingState from "../processingState.svelte";
  import ResultsList from "../resultsList.svelte";
  import ModalFooter from "../modalFooter.svelte";

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

  // Refresh labels when modal opens
  $: if (isOpen) {
    refreshLabels();
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

  async function handleModalClose() {
    if (!isProcessing) {
      baseBranch = "";
      addLabels = false;
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
      const newLabelsData =
        addLabels && selectedLabels.length > 0
          ? await convertStringLabelsToGitHubLabels(selectedLabels)
          : [];

      successfulPRs.forEach((prNumber) => {
        const currentLabels = getCurrentLabels(prNumber);
        let newLabels = currentLabels;

        if (addLabels && selectedLabels.length > 0) {
          const currentLabelNames = currentLabels.map((label) => label.name);

          // Filter out labels that already exist
          const labelsToAdd = newLabelsData.filter(
            (newLabel) => !currentLabelNames.includes(newLabel.name)
          );

          newLabels = [...currentLabels, ...labelsToAdd];
        }

        updatePRs([prNumber], {
          base: { ref: baseBranch.trim() },
          labels: newLabels,
        });
      });

      // Refresh labels in the global store
      if (addLabels) {
        await refreshLabels();
      }
    }
  }
</script>

<Modal
  bind:isOpen
  title="{t.change_selected_base} ({$selectedPRs.length})"
  maxWidth="max-w-2xl"
  on:close={handleModalClose}
>
  {#if !isProcessing && !showResults}
    <SelectedPRsList
      selectedPRs={$selectedPRs}
      {isProcessing}
      onRemove={removePR}
    />

    <div>
      <BranchSelector
        bind:selectedBranch={baseBranch}
        onBranchSelect={handleBranchSelect}
      />
    </div>

    <div>
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
      <div>
        <LabelSelector
          bind:selectedLabels
          onLabelsChange={handleLabelsChange}
        />
      </div>
    {/if}

    <ModalFooter
      cancelText={t.cancel}
      confirmText={t.confirm}
      confirmDisabled={!baseBranch.trim() || $selectedPRs.length === 0}
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
