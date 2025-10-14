<script lang="ts">
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";

  export let isOpen = false;
  export let userEmail = "";
  export let userId = "";
  export let onBan: (
    userId: string,
    expiresAt: string | null,
    reason?: string
  ) => Promise<void>;
  export let onClose: () => void;

  let t = translations.pl;
  let banType: "permanent" | "temporary" = "permanent";
  let duration: "7" | "30" | "90" | "custom" = "7";
  let customDate = "";
  let reason = "";
  let isLoading = false;

  $: if (browser) {
    t = translations[$language];
  }

  function handleClose() {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  }

  function resetForm() {
    banType = "permanent";
    duration = "7";
    customDate = "";
    reason = "";
    isLoading = false;
  }

  function getExpiresAt(): string | null {
    if (banType === "permanent") {
      return null;
    }

    if (duration === "custom") {
      return customDate ? new Date(customDate).toISOString() : null;
    }

    const days = parseInt(duration);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt.toISOString();
  }

  async function handleBan() {
    if (isLoading) return;

    const expiresAt = getExpiresAt();
    if (banType === "temporary" && !expiresAt) {
      return;
    }

    isLoading = true;
    try {
      await onBan(userId, expiresAt, reason.trim() || undefined);
      handleClose();
    } catch (error) {
      console.error("Error banning user:", error);
    } finally {
      isLoading = false;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("pl-PL");
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-800">{t.ban_user_title}</h3>
          <button
            on:click={handleClose}
            disabled={isLoading}
            class="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
            aria-label="Zamknij modal"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="mb-6">
          <p class="text-gray-600 mb-2">{t.user_email}:</p>
          <p class="font-semibold text-gray-800">{userEmail}</p>
        </div>

        <div class="space-y-6">
          <div>
            <label
              for="ban-type"
              class="block text-sm font-medium text-gray-700 mb-3"
              >{t.ban_type}</label
            >
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  type="radio"
                  bind:group={banType}
                  value="permanent"
                  disabled={isLoading}
                  class="mr-3"
                />
                <span class="text-gray-700">{t.permanent}</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  bind:group={banType}
                  value="temporary"
                  disabled={isLoading}
                  class="mr-3"
                />
                <span class="text-gray-700">{t.temporary}</span>
              </label>
            </div>
          </div>

          {#if banType === "temporary"}
            <div>
              <label
                for="ban-duration"
                class="block text-sm font-medium text-gray-700 mb-3"
                >{t.select_duration}</label
              >
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    type="radio"
                    bind:group={duration}
                    value="7"
                    disabled={isLoading}
                    class="mr-3"
                  />
                  <span class="text-gray-700">{t.days_7}</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    bind:group={duration}
                    value="30"
                    disabled={isLoading}
                    class="mr-3"
                  />
                  <span class="text-gray-700">{t.days_30}</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    bind:group={duration}
                    value="90"
                    disabled={isLoading}
                    class="mr-3"
                  />
                  <span class="text-gray-700">{t.days_90}</span>
                </label>
                <label class="flex items-center">
                  <input
                    type="radio"
                    bind:group={duration}
                    value="custom"
                    disabled={isLoading}
                    class="mr-3"
                  />
                  <span class="text-gray-700">{t.custom_duration}</span>
                </label>
              </div>

              {#if duration === "custom"}
                <div class="mt-3">
                  <input
                    type="date"
                    bind:value={customDate}
                    disabled={isLoading}
                    min={new Date().toISOString().split("T")[0]}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              {/if}

              {#if duration !== "custom"}
                <div class="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p class="text-sm text-blue-700">
                    {t.ban_expires}: {formatDate(getExpiresAt() || "")}
                  </p>
                </div>
              {/if}
            </div>
          {/if}

          <div>
            <label
              for="reason"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              {t.ban_reason_label}
            </label>
            <textarea
              id="reason"
              bind:value={reason}
              disabled={isLoading}
              placeholder={t.ban_reason_optional}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex gap-3 pt-6 border-t border-gray-200">
          <button
            on:click={handleClose}
            disabled={isLoading}
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            {t.cancel}
          </button>
          <button
            on:click={handleBan}
            disabled={isLoading || (banType === "temporary" && !getExpiresAt())}
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              <svg
                class="animate-spin h-4 w-4 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            {:else}
              {t.confirm_ban}
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
