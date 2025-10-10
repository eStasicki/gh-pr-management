<script lang="ts">
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import { onMount, tick } from "svelte";
  import { browser } from "$app/environment";

  let mounted = false;
  let AuthComponent: any = null;

  onMount(async () => {
    if (browser) {
      await tick();

      setTimeout(async () => {
        try {
          const { Auth } = await import("@supabase/auth-ui-svelte");
          const { ThemeSupa } = await import("@supabase/auth-ui-shared");

          AuthComponent = {
            Auth,
            ThemeSupa,
          };

          mounted = true;

          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
              goto("/dashboard");
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } catch (error) {
          console.error("Failed to load Auth component:", error);
          mounted = true;
        }
      }, 1000);
    }
  });
</script>

<svelte:head>
  <title>Logowanie - GitHub PR Management</title>
</svelte:head>

<div class="min-h-screen flex items-start justify-center">
  <div class="max-w-md w-full space-y-8 p-8">
    <div class="text-center">
      <h2 class="mt-6 text-3xl font-bold text-white">GitHub PR Management</h2>
      <p class="mt-2 text-sm text-blue-100">Zaloguj się aby kontynuować</p>
    </div>

    <div class="bg-white rounded-lg shadow-xl p-6">
      {#if mounted && AuthComponent}
        <svelte:component
          this={AuthComponent.Auth}
          supabaseClient={supabase}
          appearance={{
            theme: AuthComponent.ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#3b82f6",
                  brandAccent: "#1d4ed8",
                },
              },
            },
          }}
          providers={["google"]}
          redirectTo={browser
            ? `${window.location.origin}/auth/callback`
            : "/auth/callback"}
          onlyThirdPartyProviders={true}
        />
      {:else}
        <div class="text-center py-8">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
          ></div>
          <p class="mt-2 text-gray-600">Ładowanie...</p>
        </div>
      {/if}
    </div>
  </div>
</div>
