<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  onMount(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        goto("/login?error=auth_callback_error");
        return;
      }

      if (data.session) {
        goto("/dashboard");
      } else {
        goto("/login");
      }
    } catch (error) {
      goto("/login?error=unexpected_error");
    }
  });
</script>

<svelte:head>
  <title>Przetwarzanie logowania - GitHub PR Management</title>
</svelte:head>

<div
  class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800"
>
  <div class="text-center">
    <div
      class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"
    ></div>
    <p class="text-white text-lg">Przetwarzanie logowania...</p>
  </div>
</div>
