<script lang="ts">
  import "../app.css";
  import { initializeAuth } from "$lib/stores/supabaseAuth";
  import { onMount } from "svelte";
  import { inject } from "@vercel/analytics";
  import { injectSpeedInsights } from "@vercel/speed-insights";

  onMount(() => {
    initializeAuth();
    inject();
    injectSpeedInsights();
  });
</script>

<slot />
