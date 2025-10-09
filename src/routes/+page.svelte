<script lang="ts">
  import { onMount } from "svelte";
  import { supabaseAuth } from "$lib/stores/supabaseAuth";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";

  onMount(() => {
    if (browser) {
      const unsubscribe = supabaseAuth.subscribe((auth) => {
        if (!auth.loading) {
          if (auth.user) {
            goto("/dashboard");
          } else {
            goto("/login");
          }
        }
      });

      return unsubscribe;
    }
  });
</script>

<svelte:head>
  <title>GitHub PR Management</title>
</svelte:head>

<div class="flex items-center justify-center min-h-screen">
  <div class="text-center">
    <div
      class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"
    ></div>
    <p class="text-gray-600">Sprawdzanie autoryzacji...</p>
  </div>
</div>
