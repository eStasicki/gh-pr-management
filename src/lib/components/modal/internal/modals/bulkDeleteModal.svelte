<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import type { UserWithBanStatus } from "$lib/services/adminService";

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let selectedUsers: UserWithBanStatus[] = [];

  let t = translations.pl;
  let confirmationText = "";
  let isDeleting = false;
  let errorMessage = "";

  $: if (browser) {
    t = translations[$language];
  }

  $: isDeleteEnabled = confirmationText === "DELETE";

  function handleDelete() {
    if (!isDeleteEnabled || isDeleting) return;

    isDeleting = true;
    errorMessage = "";

    dispatch("delete");
  }

  function handleClose() {
    if (isDeleting) return;

    confirmationText = "";
    errorMessage = "";
    dispatch("close");
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && !isDeleting) {
      handleClose();
    }
  }

  export function setError(message: string) {
    errorMessage = message;
    isDeleting = false;
  }

  export function setSuccess() {
    isDeleting = false;
    confirmationText = "";
    errorMessage = "";
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">{t.bulk_delete_users}</h3>
          <button
            on:click={handleClose}
            disabled={isDeleting}
            class="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
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
          <p class="text-gray-600 mb-2">
            {t.bulk_delete_confirm.replace(
              "{count}",
              selectedUsers.length.toString()
            )}
          </p>
          <div class="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
            <ul class="space-y-1">
              {#each selectedUsers as user}
                <li class="text-sm text-gray-700">• {user.email}</li>
              {/each}
            </ul>
          </div>
        </div>

        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-start">
            <svg
              class="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <p class="text-sm font-medium text-red-800 mb-1">
                {t.bulk_delete_confirm.replace(
                  "{count}",
                  selectedUsers.length.toString()
                )}
              </p>
              <p class="text-sm text-red-700">
                {t.delete_user_warning}
              </p>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <label
            for="confirmation-input"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            {t.delete_user_confirm}
          </label>
          <input
            type="text"
            id="confirmation-input"
            bind:value={confirmationText}
            placeholder={t.delete_user_input_placeholder}
            disabled={isDeleting}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p class="mt-1 text-xs text-gray-500">
            {t.type_delete_to_confirm}
          </p>
        </div>

        {#if errorMessage}
          <div class="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-800">{errorMessage}</p>
          </div>
        {/if}

        <div class="flex gap-3 pt-6 border-t border-gray-200">
          <button
            on:click={handleClose}
            disabled={isDeleting}
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            on:click={handleDelete}
            disabled={!isDeleteEnabled || isDeleting}
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isDeleting}
              <svg
                class="animate-spin h-4 w-4 mx-auto"
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
            {:else}
              <svg
                class="w-4 h-4 mr-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {t.bulk_delete_users}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
