<script lang="ts">
  export let selectedPRs: number[] = [];
  export let isProcessing = false;
  export let onRemove: (prNumber: number) => void = () => {};
  export let maxHeight = "max-h-32";
</script>

<div>
  <h4 class="text-sm font-semibold text-gray-700 mb-2">Wybrane PR:</h4>
  <div
    class="{maxHeight} overflow-y-auto border border-gray-200 rounded-lg p-3"
  >
    <div class="flex flex-wrap gap-2">
      {#each selectedPRs as prNumber}
        <span
          class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
        >
          #{prNumber}
          {#if !isProcessing}
            <button
              on:click={() => onRemove(prNumber)}
              class="ml-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
              aria-label="Remove PR {prNumber}"
            >
              <svg
                class="w-3 h-3"
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
            </button>
          {/if}
        </span>
      {/each}
    </div>
  </div>
</div>
