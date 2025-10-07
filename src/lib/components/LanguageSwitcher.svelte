<script lang="ts">
  import { language } from "$lib/stores/language";

  function setLanguage(lang: "pl" | "en") {
    language.set(lang);
  }
</script>

<div class="flex gap-3">
  <button
    class="px-4 py-2 border-2 border-gray-200 bg-white rounded-lg cursor-pointer transition-all duration-300 font-medium hover:border-primary-500 hover:-translate-y-0.5 {$language ===
    'pl'
      ? 'border-primary-500 bg-primary-50 text-primary-700'
      : 'text-gray-700'}"
    on:click={() => setLanguage("pl")}
  >
    Polski
  </button>
  <button
    class="px-4 py-2 border-2 border-gray-200 bg-white rounded-lg cursor-pointer transition-all duration-300 font-medium hover:border-primary-500 hover:-translate-y-0.5 {$language ===
    'en'
      ? 'border-primary-500 bg-primary-50 text-primary-700'
      : 'text-gray-700'}"
    on:click={() => setLanguage("en")}
  >
    English
  </button>
</div>
