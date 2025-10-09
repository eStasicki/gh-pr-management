<script lang="ts">
  import { page } from "$app/stores";
  import { admin } from "$lib/stores";
  import { supabaseAuth, signOut } from "$lib/stores/supabaseAuth";
  import { goto } from "$app/navigation";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";

  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  const handleSignOut = async () => {
    await signOut();
    goto("/login");
  };
</script>

<nav class="flex gap-4">
  <a
    href="/dashboard"
    class="px-4 py-2 rounded-lg transition-colors duration-200 {$page.url
      .pathname === '/dashboard'
      ? 'bg-blue-100 text-blue-700 font-semibold'
      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}"
  >
    {t.dashboard_nav}
  </a>
  <a
    href="/settings"
    class="px-4 py-2 rounded-lg transition-colors duration-200 {$page.url
      .pathname === '/settings'
      ? 'bg-blue-100 text-blue-700 font-semibold'
      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}"
  >
    {t.settings_nav}
  </a>
  {#if $admin.isAdmin}
    <a
      href="/admin"
      class="px-4 py-2 rounded-lg transition-colors duration-200 {$page.url
        .pathname === '/admin'
        ? 'bg-red-100 text-red-700 font-semibold'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}"
    >
      {t.admin_nav}
    </a>
  {/if}
</nav>
<button
  on:click={handleSignOut}
  class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition duration-200"
>
  {t.sign_out}
</button>
