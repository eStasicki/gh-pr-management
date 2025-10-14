<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";

  export let isOpen = false;
  export let onClose: () => void;
  export let onConfirm: (action: string, labels: string[]) => void;

  let t = translations.pl;
  let action = "add";
  let labelsInput = "";

  $: if (browser) {
    t = translations[$language];
  }

  function handleConfirm() {
    if (labelsInput.trim()) {
      const labels = labelsInput
        .split(",")
        .map((label) => label.trim())
        .filter((label) => label.length > 0);
      onConfirm(action, labels);
      onClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <h3 class="text-xl font-bold text-gray-800 mb-4">
        {t.manage_labels}
      </h3>

      <div class="mb-4">
        <label class="block text-sm font-semibold text-gray-700 mb-2">
          {t.action}:
        </label>
        <select
          bind:value={action}
          class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="add">{t.add_labels}</option>
          <option value="remove">{t.remove_labels}</option>
        </select>
      </div>

      <div class="mb-4">
        <label
          for="labels"
          class="block text-sm font-semibold text-gray-700 mb-2"
        >
          {t.labels}:
        </label>
        <input
          id="labels"
          type="text"
          bind:value={labelsInput}
          placeholder="bug, enhancement, documentation"
          class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
        <small class="text-gray-500 text-sm mt-1">
          {t.labels_help}
        </small>
      </div>

      <div class="flex gap-3 justify-end">
        <button
          on:click={onClose}
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-300"
        >
          {t.cancel}
        </button>
        <button
          on:click={handleConfirm}
          disabled={!labelsInput.trim()}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {t.confirm}
        </button>
      </div>
    </div>
  </div>
{/if}
