<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";

  export let isOpen = false;
  export let banInfo: {
    reason: string | null;
    ban_expires_at: string | null;
    banned_at: string;
  } | null = null;

  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  function handleClose() {
    goto("/login");
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isExpired(): boolean {
    if (!banInfo?.ban_expires_at) return false;
    return new Date(banInfo.ban_expires_at) <= new Date();
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
      <div class="p-6">
        <div class="text-center mb-6">
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"
          >
            <svg
              class="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">
            {t.account_banned_title}
          </h3>
          <p class="text-gray-600">{t.account_banned_message}</p>
        </div>

        {#if banInfo}
          <div class="space-y-4 mb-6">
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="text-sm text-gray-600 mb-2">{t.banned_at}:</div>
              <div class="font-medium text-gray-800">
                {formatDate(banInfo.banned_at)}
              </div>
            </div>

            {#if banInfo.ban_expires_at}
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="text-sm text-gray-600 mb-2">{t.expires_at}:</div>
                <div class="font-medium text-gray-800">
                  {isExpired()
                    ? t.never_expires
                    : formatDate(banInfo.ban_expires_at)}
                </div>
              </div>
            {:else}
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="text-sm text-gray-600 mb-2">{t.expires_at}:</div>
                <div class="font-medium text-gray-800">{t.never_expires}</div>
              </div>
            {/if}

            {#if banInfo.reason}
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="text-sm text-gray-600 mb-2">
                  {t.ban_reason_text}
                </div>
                <div class="font-medium text-gray-800">{banInfo.reason}</div>
              </div>
            {/if}
          </div>
        {/if}

        <div class="text-center">
          <p class="text-sm text-gray-500 mb-4">
            {banInfo?.ban_expires_at && !isExpired()
              ? "Twój ban wygaśnie automatycznie w podanym terminie."
              : "Skontaktuj się z administratorem w celu odbanowania konta."}
          </p>
          <button
            on:click={handleClose}
            class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
