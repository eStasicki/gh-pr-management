<script lang="ts">
  export let currentItem: number | string = "";
  export let processedCount = 0;
  export let totalCount = 0;
  export let message = "Operacja w toku...";
  export let itemLabel = "PR";
</script>

<div class="text-center">
  <div class="mb-4">
    <div
      class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
    ></div>
  </div>
  <p class="text-lg font-semibold text-gray-700 mb-2">
    {message}
  </p>
  <p class="text-sm text-gray-600 mb-4">
    Przetwarzanie {itemLabel} #{currentItem}
  </p>
  <div class="w-full bg-gray-200 rounded-full h-2">
    <div
      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style="width: {(processedCount / totalCount) * 100}%"
    ></div>
  </div>
  <p class="text-xs text-gray-500 mt-2">
    {processedCount} / {totalCount}
  </p>
</div>
