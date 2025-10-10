<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import Modal from "../Modal.svelte";
  import ModalFooter from "../modal-parts/ModalFooter.svelte";

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
  maxWidth="max-w-2xl"
  on:close={handleModalClose}
>
  <div>
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

  <ModalFooter
    cancelText={t.cancel}
    confirmText={t.confirm}
    confirmDisabled={!baseBranch.trim()}
    onCancel={handleModalClose}
    onConfirm={handleConfirm}
  />
</Modal>
