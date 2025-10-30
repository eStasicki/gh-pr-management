<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";

  type UpdateStatus =
    | "idle"
    | "checking"
    | "available"
    | "not-available"
    | "downloading"
    | "downloaded"
    | "error";

  let status: UpdateStatus = "idle";
  let currentVersion = "";
  let availableVersion = "";
  let downloadProgress = 0;
  let errorMessage = "";
  let isElectron = false;

  const cleanupFunctions: Array<() => void> = [];

  onMount(async () => {
    if (!browser) return;

    isElectron = typeof window !== "undefined" && !!window.electronAPI;

    if (!isElectron) return;

    // Get current version
    if (window.electronAPI) {
      currentVersion = await window.electronAPI.getAppVersion();

      // Set up event listeners
      if (window.electronAPI.onUpdateChecking) {
        cleanupFunctions.push(
          window.electronAPI.onUpdateChecking(() => {
            status = "checking";
            errorMessage = "";
          })
        );
      }

      if (window.electronAPI.onUpdateAvailable) {
        cleanupFunctions.push(
          window.electronAPI.onUpdateAvailable((info) => {
            status = "available";
            availableVersion = info.version;
          })
        );
      }

      if (window.electronAPI.onUpdateNotAvailable) {
        cleanupFunctions.push(
          window.electronAPI.onUpdateNotAvailable(() => {
            status = "not-available";
          })
        );
      }

      if (window.electronAPI.onUpdateError) {
        cleanupFunctions.push(
          window.electronAPI.onUpdateError((error) => {
            status = "error";
            errorMessage = error.message;
          })
        );
      }

      if (window.electronAPI.onUpdateDownloadProgress) {
        cleanupFunctions.push(
          window.electronAPI.onUpdateDownloadProgress((progress) => {
            status = "downloading";
            downloadProgress = progress.percent;
          })
        );
      }

      if (window.electronAPI.onUpdateDownloaded) {
        cleanupFunctions.push(
          window.electronAPI.onUpdateDownloaded(() => {
            status = "downloaded";
          })
        );
      }
    }

    // Check for updates on mount
    await handleCheckForUpdates();
  });

  onDestroy(() => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  });

  async function handleCheckForUpdates() {
    if (!window.electronAPI) return;

    status = "checking";
    errorMessage = "";

    try {
      await window.electronAPI.checkForUpdates();
    } catch (error: any) {
      status = "error";
      errorMessage = error?.message || "Failed to check for updates";
    }
  }

  async function handleDownloadUpdate() {
    if (!window.electronAPI) return;

    status = "downloading";
    errorMessage = "";

    try {
      await window.electronAPI.downloadUpdate();
    } catch (error: any) {
      status = "error";
      errorMessage = error?.message || "Failed to download update";
    }
  }

  async function handleInstallUpdate() {
    if (!window.electronAPI) return;

    try {
      await window.electronAPI.installUpdate();
    } catch (error: any) {
      status = "error";
      errorMessage = error?.message || "Failed to install update";
    }
  }
</script>

{#if isElectron}
  <div
    class="bg-white rounded-lg p-4 shadow-lg mb-4 border border-gray-200"
    role="region"
    aria-label="Update status"
  >
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-semibold text-gray-700">Aktualizacje aplikacji</h3>
        {#if currentVersion}
          <span class="text-xs text-gray-500">(v{currentVersion})</span>
        {/if}
      </div>
      {#if status === "idle" || status === "not-available" || status === "error"}
        <button
          on:click={handleCheckForUpdates}
          disabled={status === "checking"}
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Sprawdź aktualizacje"
        >
          {#if status === "checking"}
            <span class="inline-flex items-center gap-1">
              <svg
                class="animate-spin h-3 w-3"
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
              Sprawdzam...
            </span>
          {:else}
            Sprawdź aktualizacje
          {/if}
        </button>
      {/if}
    </div>

    {#if status === "checking"}
      <p class="text-sm text-gray-600">Sprawdzam dostępność aktualizacji...</p>
    {:else if status === "available"}
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <svg
            class="w-5 h-5 text-green-600"
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
          <p class="text-sm font-medium text-green-700">
            Dostępna nowa wersja: v{availableVersion}
          </p>
        </div>
        <button
          on:click={handleDownloadUpdate}
          class="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
          aria-label="Pobierz aktualizację"
        >
          Pobierz aktualizację
        </button>
      </div>
    {:else if status === "downloading"}
      <div class="space-y-2">
        <p class="text-sm text-gray-600">Pobieranie aktualizacji...</p>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style="width: {downloadProgress}%"
            role="progressbar"
            aria-valuenow={downloadProgress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span class="sr-only">{downloadProgress}%</span>
          </div>
        </div>
        <p class="text-xs text-gray-500">{downloadProgress}%</p>
      </div>
    {:else if status === "downloaded"}
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <svg
            class="w-5 h-5 text-green-600"
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
          <p class="text-sm font-medium text-green-700">
            Aktualizacja pobrana pomyślnie
          </p>
        </div>
        <button
          on:click={handleInstallUpdate}
          class="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          aria-label="Zainstaluj i uruchom ponownie"
        >
          Zainstaluj i uruchom ponownie
        </button>
      </div>
    {:else if status === "not-available"}
      <p class="text-sm text-gray-600">
        Używasz najnowszej wersji aplikacji
      </p>
    {:else if status === "error"}
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <svg
            class="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-sm font-medium text-red-700">Błąd podczas sprawdzania aktualizacji</p>
        </div>
        {#if errorMessage}
          <p class="text-xs text-red-600">{errorMessage}</p>
        {/if}
      </div>
    {/if}
  </div>
{/if}
