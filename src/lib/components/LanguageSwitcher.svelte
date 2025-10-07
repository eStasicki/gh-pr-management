<script lang="ts">
  import { language } from "$lib/stores/language";

  function setLanguage(event: Event) {
    const target = event.target as HTMLSelectElement;
    language.set(target.value as "pl" | "en");
  }
</script>

<div class="relative">
  <select
    bind:value={$language}
    on:change={setLanguage}
    class="px-4 py-2 border-2 border-gray-200 bg-white rounded-lg cursor-pointer transition-all duration-300 font-medium hover:border-primary-500 focus:border-primary-500 focus:outline-none appearance-none pr-8 text-gray-700"
  >
    <option value="pl">Polski</option>
    <option value="en">English</option>
  </select>
  <div
    class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
  >
    <svg
      class="w-4 h-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </div>
</div>
