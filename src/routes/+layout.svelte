<script lang="ts">
  import "../app.css";
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
  import { page } from "$app/stores";
</script>

<div
  class="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800"
>
  <div class="max-w-6xl mx-auto p-5">
    <header
      class="bg-white rounded-2xl p-6 mb-6 shadow-2xl flex justify-between items-center"
    >
      <h1 class="text-3xl font-bold text-gray-800">GitHub PR Management</h1>
      <LanguageSwitcher />
    </header>

    <main>
      <slot />
    </main>
  </div>
</div>
