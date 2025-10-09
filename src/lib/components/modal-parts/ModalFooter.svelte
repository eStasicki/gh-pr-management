<script lang="ts">
  export let showCancel = true;
  export let cancelText = "Anuluj";
  export let confirmText = "Potwierdź";
  export let confirmDisabled = false;
  export let confirmVariant: "primary" | "success" | "danger" = "primary";
  export let isProcessing = false;
  export let onCancel: () => void = () => {};
  export let onConfirm: () => void = () => {};

  $: confirmClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[confirmVariant];
</script>

<div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
  {#if showCancel}
    <button
      on:click={onCancel}
      disabled={isProcessing}
      class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    >
      {cancelText}
    </button>
  {/if}
  <button
    on:click={onConfirm}
    disabled={confirmDisabled || isProcessing}
    class="px-4 py-2 rounded-lg font-semibold cursor-pointer transition-all duration-300 {confirmClasses} disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {confirmText}
  </button>
</div>
