<script lang="ts">
  import "../app.css";
  import { initializeAuth } from "$lib/stores/supabaseAuth";
  import { onMount } from "svelte";

  onMount(() => {
    initializeAuth();
  });
</script>

<slot />
