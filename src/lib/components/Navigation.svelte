<script lang="ts">
  import { admin } from "$lib/stores";
  import { supabaseAuth, signOut } from "$lib/stores/supabaseAuth";
  import { goto } from "$app/navigation";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import NavLink from "./navLink.svelte";

  export let isMobile = false;
  export let onLinkClick: (() => void) | undefined = undefined;

  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  const handleSignOut = async () => {
    await signOut();
    goto("/login");
  };
</script>

<nav class={isMobile ? "flex flex-col gap-2 w-full" : "flex gap-4"}>
  <NavLink href="/dashboard" {isMobile} {onLinkClick} isAdmin={false}>
    {t.dashboard_nav}
  </NavLink>

  <NavLink href="/settings" {isMobile} {onLinkClick} isAdmin={false}>
    {t.settings_nav}
  </NavLink>

  {#if $admin.isAdmin}
    <NavLink href="/admin" {isMobile} {onLinkClick} isAdmin={true}>
      {t.admin_nav}
    </NavLink>
  {/if}
</nav>
<button
  on:click={handleSignOut}
  class={isMobile
    ? "w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition duration-200"
    : "px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition duration-200"}
>
  {t.sign_out}
</button>
