<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import ChangeAllBaseModal from "./modals/ChangeAllBaseModal.svelte";
  import ChangeBaseLabelsModal from "./modals/ChangeBaseLabelsModal.svelte";
  import ChangeSpecificBaseModal from "./modals/ChangeSpecificBaseModal.svelte";
  import ManageLabelsModal from "./modals/ManageLabelsModal.svelte";
  import { githubAPI } from "$lib/services/github-api";

  let t = translations.pl;
  let showChangeAllBase = false;
  let showChangeBaseLabels = false;
  let showChangeSpecificBase = false;
  let showManageLabels = false;
  let isLoading = false;
  let lastResult: { success: number; failed: number; errors: string[] } | null =
    null;

  $: if (browser) {
    t = translations[$language];
  }

  function openChangeAllBase() {
    showChangeAllBase = true;
  }

  function openChangeBaseLabels() {
    showChangeBaseLabels = true;
  }

  function openChangeSpecificBase() {
    showChangeSpecificBase = true;
  }

  function openManageLabels() {
    showManageLabels = true;
  }

  function closeAllModals() {
    showChangeAllBase = false;
    showChangeBaseLabels = false;
    showChangeSpecificBase = false;
    showManageLabels = false;
  }

  async function handleChangeAllBase(baseBranch: string) {
    isLoading = true;
    lastResult = null;

    try {
      const result = await githubAPI.updateAllPRsBase(baseBranch);
      lastResult = result;

      if (result.failed === 0) {
        alert(
          `✅ Sukces! Zaktualizowano ${result.success} PR-ów. Base branch zmieniony na: ${baseBranch}`
        );
      } else {
        alert(
          `⚠️ Częściowy sukces! Zaktualizowano ${result.success} PR-ów, ${result.failed} nie udało się. Base branch: ${baseBranch}\n\nBłędy:\n${result.errors.join("\n")}`
        );
      }
    } catch (error) {
      alert(
        `❌ Błąd: ${error instanceof Error ? error.message : "Nieznany błąd"}`
      );
    } finally {
      isLoading = false;
    }
  }

  async function handleChangeBaseLabels(baseBranch: string, labels: string[]) {
    isLoading = true;
    lastResult = null;

    try {
      const result = await githubAPI.updatePRsBaseAndLabels(baseBranch, labels);
      lastResult = result;

      if (result.failed === 0) {
        alert(
          `✅ Sukces! Zaktualizowano ${result.success} PR-ów. Base branch: ${baseBranch}, Etykiety: ${labels.join(", ")}`
        );
      } else {
        alert(
          `⚠️ Częściowy sukces! Zaktualizowano ${result.success} PR-ów, ${result.failed} nie udało się.\nBase branch: ${baseBranch}\nEtykiety: ${labels.join(", ")}\n\nBłędy:\n${result.errors.join("\n")}`
        );
      }
    } catch (error) {
      alert(
        `❌ Błąd: ${error instanceof Error ? error.message : "Nieznany błąd"}`
      );
    } finally {
      isLoading = false;
    }
  }

  async function handleChangeSpecificBase(
    prNumber: string,
    baseBranch: string
  ) {
    isLoading = true;

    try {
      const prNum = parseInt(prNumber);
      if (isNaN(prNum)) {
        throw new Error("Nieprawidłowy numer PR");
      }

      await githubAPI.updatePRBase(prNum, baseBranch);
      alert(
        `✅ Sukces! Zaktualizowano PR #${prNumber}. Base branch zmieniony na: ${baseBranch}`
      );
    } catch (error) {
      alert(
        `❌ Błąd: ${error instanceof Error ? error.message : "Nieznany błąd"}`
      );
    } finally {
      isLoading = false;
    }
  }

  async function handleManageLabels(action: string, labels: string[]) {
    isLoading = true;
    lastResult = null;

    try {
      const result = await githubAPI.manageLabelsOnAllPRs(
        action as "add" | "remove",
        labels
      );
      lastResult = result;

      const actionText = action === "add" ? "dodano" : "usunięto";
      if (result.failed === 0) {
        alert(
          `✅ Sukces! ${actionText} etykiety w ${result.success} PR-ach: ${labels.join(", ")}`
        );
      } else {
        alert(
          `⚠️ Częściowy sukces! ${actionText} etykiety w ${result.success} PR-ach, ${result.failed} nie udało się.\nEtykiety: ${labels.join(", ")}\n\nBłędy:\n${result.errors.join("\n")}`
        );
      }
    } catch (error) {
      alert(
        `❌ Błąd: ${error instanceof Error ? error.message : "Nieznany błąd"}`
      );
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="bg-white rounded-2xl">
  <h2 class="text-2xl font-bold text-gray-800 mb-6">
    {t.actions}
  </h2>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <button
      on:click={openChangeAllBase}
      disabled={isLoading}
      class="bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {#if isLoading}
        {t.loading}...
      {:else}
        {t.change_all_base}
      {/if}
    </button>

    <button
      on:click={openChangeBaseLabels}
      disabled={isLoading}
      class="bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {#if isLoading}
        {t.loading}...
      {:else}
        {t.change_base_labels}
      {/if}
    </button>

    <button
      on:click={openChangeSpecificBase}
      disabled={isLoading}
      class="bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {#if isLoading}
        {t.loading}...
      {:else}
        {t.change_specific_base}
      {/if}
    </button>

    <button
      on:click={openManageLabels}
      disabled={isLoading}
      class="bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {#if isLoading}
        {t.loading}...
      {:else}
        {t.manage_labels}
      {/if}
    </button>
  </div>

  <!-- Modals -->
  <ChangeAllBaseModal
    isOpen={showChangeAllBase}
    onClose={closeAllModals}
    onConfirm={handleChangeAllBase}
  />

  <ChangeBaseLabelsModal
    isOpen={showChangeBaseLabels}
    onClose={closeAllModals}
    onConfirm={handleChangeBaseLabels}
  />

  <ChangeSpecificBaseModal
    isOpen={showChangeSpecificBase}
    onClose={closeAllModals}
    onConfirm={handleChangeSpecificBase}
  />

  <ManageLabelsModal
    isOpen={showManageLabels}
    onClose={closeAllModals}
    onConfirm={handleManageLabels}
  />
</div>
