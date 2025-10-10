<script lang="ts">
  import "../app.css";
  import { initializeAuth } from "$lib/stores/supabaseAuth";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import { inject } from "@vercel/analytics";
  import { injectSpeedInsights } from "@vercel/speed-insights";

  onMount(async () => {
    if (browser) {
      await initializeAuth();

      setTimeout(() => {
        inject();
        injectSpeedInsights();
      }, 100);
    }
  });
</script>

<slot />
