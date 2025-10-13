<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getCacheInfo, clearCache } from "$lib/utils/apiUtils";
  import { browser } from "$app/environment";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";

  let cacheInfo: {
    size: number;
    rateLimit: { remaining: number; reset: number; used: number } | null;
  } = { size: 0, rateLimit: null };
  let showDetails = false;
  let t = translations.pl;
  let interval: ReturnType<typeof setInterval>;

  $: if (browser) {
    t = translations[$language];
  }

  function updateCacheInfo() {
    if (browser) {
      cacheInfo = getCacheInfo();
    }
  }

  function handleClearCache() {
    clearCache();
    updateCacheInfo();
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  function formatRemainingTime(resetTime: number): string {
    const now = Date.now();
    const remaining = Math.max(0, resetTime - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function toggleDetails() {
    showDetails = !showDetails;
  }

  onMount(() => {
    updateCacheInfo();
    interval = setInterval(updateCacheInfo, 5000); // Refresh every 5 seconds
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });

  $: if (browser) {
    updateCacheInfo();
  }
</script>

{#if browser}
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-800">{t.api_status}</h3>
      <button
        on:click={toggleDetails}
        class="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        {showDetails ? t.hide_details : t.show_details}
      </button>
    </div>

    <div class="space-y-3">
      <div class="flex justify-between items-center">
        <span class="text-gray-600 font-medium">{t.cache_entries}:</span>
        <span class="font-mono text-lg font-semibold">{cacheInfo.size}</span>
      </div>

      {#if cacheInfo.rateLimit}
        <div class="flex justify-between items-center">
          <span class="text-gray-600 font-medium">{t.rate_limit}:</span>
          <span
            class="font-mono text-lg font-semibold {cacheInfo.rateLimit
              .remaining < 10
              ? 'text-red-600'
              : 'text-green-600'}"
          >
            {cacheInfo.rateLimit.remaining}/{cacheInfo.rateLimit.remaining +
              cacheInfo.rateLimit.used}
          </span>
        </div>

        {#if showDetails}
          <div class="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
            <div class="text-sm text-gray-600">
              <span class="font-medium">{t.used}:</span>
              {cacheInfo.rateLimit.used}
            </div>
            <div class="text-sm text-gray-600">
              <span class="font-medium">{t.reset_in}:</span>
              {formatRemainingTime(cacheInfo.rateLimit.reset)}
            </div>
            <div class="text-sm text-gray-600">
              <span class="font-medium">{t.reset_at}:</span>
              {formatTime(cacheInfo.rateLimit.reset)}
            </div>
          </div>
        {/if}
      {/if}

      <div class="pt-4 border-t border-gray-200">
        <button
          on:click={handleClearCache}
          class="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
        >
          {t.clear_cache}
        </button>
      </div>
    </div>
  </div>
{/if}
