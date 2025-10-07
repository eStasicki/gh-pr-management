<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import Modal from "../Modal.svelte";

  export let isOpen = false;
  export let onClose: () => void;
  export let onConfirm: (baseBranch: string) => void;

  let t = translations.pl;
  let baseBranch = "";

  $: if (browser) {
    t = translations[$language];
  }

  function handleConfirm() {
    if (baseBranch.trim()) {
      onConfirm(baseBranch.trim());
      onClose();
    }
  }

  function handleModalClose() {
    baseBranch = "";
    onClose();
  }
</script>

<Modal
  bind:isOpen
  title={t.change_all_base}
  maxWidth="max-w-md"
  on:close={handleModalClose}
>
  <div class="mb-4">
    <label
      for="base-branch"
      class="block text-sm font-semibold text-gray-700 mb-2"
    >
      {t.base_branch}:
    </label>
    <input
      id="base-branch"
      type="text"
      bind:value={baseBranch}
      placeholder="main"
      class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  </div>

  <div class="flex gap-3 justify-end">
    <button
      on:click={handleModalClose}
      class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-gray-300"
    >
      {t.cancel}
    </button>
    <button
      on:click={handleConfirm}
      disabled={!baseBranch.trim()}
      class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {t.confirm}
    </button>
  </div>
</Modal>
