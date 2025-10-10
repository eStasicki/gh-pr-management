<script lang="ts">
  import { page } from "$app/stores";

  export let href: string;
  export let isMobile: boolean = false;
  export let onLinkClick: (() => void) | undefined = undefined;
  export let isAdmin: boolean = false;

  $: isActive = $page.url.pathname === href;

  const baseClasses = isMobile
    ? "w-full px-4 py-3 rounded-lg transition-colors duration-200 text-center"
    : "px-4 py-2 rounded-lg transition-colors duration-200";

  const activeClasses = isAdmin
    ? "bg-red-100 text-red-700 active"
    : "bg-blue-100 text-blue-700 active";

  const inactiveClasses = "text-gray-600 hover:text-gray-800 hover:bg-gray-100";

  $: classes = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
</script>

<a
  {href}
  on:click={isMobile && onLinkClick ? onLinkClick : undefined}
  class={classes}
>
  <slot />
</a>
