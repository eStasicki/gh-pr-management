<script lang="ts">
  export let results: Array<{
    id: number | string;
    success: boolean;
    error?: string;
  }> = [];
  export let successMessage = "Operacja zakończona pomyślnie";
  export let failureMessage = "Operacja zakończona z błędami";
  export let itemLabel = "PR";

  $: successCount = results.filter((r) => r.success).length;
  $: isAllSuccessful = successCount === results.length;
</script>

<div class="mb-4">
  <h4 class="text-lg font-semibold text-gray-800 mb-3">
    {isAllSuccessful ? successMessage : failureMessage}
  </h4>
  <div class="space-y-2 max-h-48 overflow-y-auto">
    {#each results as result}
      <div
        class="flex items-center justify-between p-2 rounded {result.success
          ? 'bg-green-50'
          : 'bg-red-50'}"
      >
        <span class="text-sm font-medium">
          {itemLabel} #{result.id}
        </span>
        <div class="flex items-center gap-2">
          {#if result.success}
            <svg
              class="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span class="text-sm text-green-600 font-medium">OK</span>
          {:else}
            <svg
              class="w-4 h-4 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
            <span class="text-sm text-red-600 font-medium">Error</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
