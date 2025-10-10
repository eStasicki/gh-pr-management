<script lang="ts">
  import { Auth } from "@supabase/auth-ui-svelte";
  import { ThemeSupa } from "@supabase/auth-ui-shared";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  onMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        goto("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
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
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
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
    </div>
  </div>
</div>
