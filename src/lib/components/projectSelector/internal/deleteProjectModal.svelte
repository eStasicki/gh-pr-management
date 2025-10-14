<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import type { Project } from "$lib/services/projectsService";
  import Modal from "../../modal/modal.svelte";
  import ModalFooter from "../../modal/internal/modalFooter.svelte";

  export let isOpen = false;
  export let project: Project;

  const dispatch = createEventDispatcher();

  let t = translations.pl;
  let confirmationText = "";
  let errorMessage = "";

  $: if (browser) {
    t = translations[$language];
  }

  $: if (isOpen && project) {
    confirmationText = "";
    errorMessage = "";
  }

  function handleClose() {
    confirmationText = "";
    errorMessage = "";
    dispatch("close");
  }

  function handleDelete() {
    errorMessage = "";

    if (confirmationText !== "DELETE") {
      errorMessage = t.delete_confirmation_required;
      return;
    }

    dispatch("delete");
  }
</script>

<Modal
  bind:isOpen
  title={t.delete_project}
  maxWidth="max-w-md"
  on:close={handleClose}
>
  {#if errorMessage}
    <div
      class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
    >
      {errorMessage}
    </div>
  {/if}

  <div class="space-y-4">
    <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center">
        <svg
          class="w-6 h-6 text-red-600 mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div>
          <h3 class="text-lg font-semibold text-red-800">
            {t.delete_project_warning}
          </h3>
          <p class="text-sm text-red-700 mt-1">
            {t.delete_project_warning_description}
          </p>
        </div>
      </div>
    </div>

    <div class="p-3 bg-gray-50 rounded-lg">
      <p class="text-sm text-gray-600">
        <span class="font-medium">{t.project_name}:</span>
        {project.project_name}
      </p>
      <p class="text-sm text-gray-500 mt-1">
        {project.repo_owner}/{project.repo_name}
      </p>
    </div>

    <div>
      <label
        for="confirmation-text"
        class="block text-sm font-semibold text-gray-700 mb-2"
      >
        {t.delete_confirmation_label}:
      </label>
      <input
        id="confirmation-text"
        type="text"
        bind:value={confirmationText}
        placeholder="DELETE"
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
      />
      <p class="text-sm text-gray-500 mt-2">
        {t.delete_confirmation_help}
      </p>
    </div>
  </div>

  <ModalFooter
    cancelText={t.cancel}
    confirmText={t.delete_project}
    confirmDisabled={confirmationText !== "DELETE"}
    confirmVariant="danger"
    onCancel={handleClose}
    onConfirm={handleDelete}
  />
</Modal>
