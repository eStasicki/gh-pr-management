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
  let newName = "";
  let errorMessage = "";

  $: if (browser) {
    t = translations[$language];
  }

  $: if (isOpen && project) {
    newName = project.project_name;
    errorMessage = "";
  }

  function handleClose() {
    newName = "";
    errorMessage = "";
    dispatch("close");
  }

  function handleRename() {
    errorMessage = "";

    if (!newName.trim()) {
      errorMessage = t.project_name_required;
      return;
    }

    if (newName.length > 100) {
      errorMessage = t.project_name_too_long;
      return;
    }

    if (newName.trim() === project.project_name) {
      handleClose();
      return;
    }

    dispatch("rename", { newName: newName.trim() });
  }
</script>

<Modal
  bind:isOpen
  title={t.rename_project}
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
    <div>
      <label
        for="new-project-name"
        class="block text-sm font-semibold text-gray-700 mb-2"
      >
        {t.project_name}:
      </label>
      <input
        id="new-project-name"
        type="text"
        bind:value={newName}
        placeholder={t.project_name_placeholder}
        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>

    <div class="p-3 bg-gray-50 rounded-lg">
      <p class="text-sm text-gray-600">
        <span class="font-medium">{t.current_project}:</span>
        {project.project_name}
      </p>
      <p class="text-sm text-gray-500 mt-1">
        {project.repo_owner}/{project.repo_name}
      </p>
    </div>
  </div>

  <ModalFooter
    cancelText={t.cancel}
    confirmText={t.rename_project}
    confirmDisabled={!newName.trim() || newName.trim() === project.project_name}
    onCancel={handleClose}
    onConfirm={handleRename}
  />
</Modal>
