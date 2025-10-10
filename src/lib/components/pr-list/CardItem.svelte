<script lang="ts">
  import { selectedPRs } from "$lib/stores";
  import { language } from "$lib/stores/language";
  import { translations } from "$lib/translations";
  import { browser } from "$app/environment";
  import type { GitHubPR } from "$lib/types";

  export let pr: GitHubPR;
  export let onToggleSelection: (prNumber: number) => void;

  let t = translations.pl;

  $: if (browser) {
    t = translations[$language];
  }

  $: isSelected = $selectedPRs.includes(pr.number);

  function handleCardClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === "A" || target.closest("a")) {
      return;
    }
    onToggleSelection(pr.number);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const target = event.target as HTMLElement;
      if (target.tagName === "A" || target.closest("a")) {
        return;
      }
      onToggleSelection(pr.number);
    }
  }
</script>

<div
  class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer {isSelected
    ? 'bg-blue-50 border-blue-300'
    : 'bg-white'}"
  on:click={handleCardClick}
  on:keydown={handleKeyDown}
  role="button"
  tabindex="0"
  aria-label="Toggle selection for PR #{pr.number}"
>
  <div class="flex items-center space-x-3">
    <input
      type="checkbox"
      checked={isSelected}
      readonly
      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded pointer-events-none"
    />
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900 truncate">
          <a
            href={pr.html_url}
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-blue-600 transition-colors duration-200"
          >
            {pr.title}
          </a>
        </h3>
        <span class="ml-2 text-xs text-gray-500">#{pr.number}</span>
      </div>
      <div class="mt-1 flex items-center space-x-2">
        <span class="text-xs text-gray-500">
          {t.author}: {pr.user.login}
        </span>
        <span class="text-xs text-gray-400">•</span>
        <span class="text-xs text-gray-500">
          {t.base_branch}: {pr.base.ref}
        </span>
        <span class="text-xs text-gray-400">•</span>
        <span class="text-xs text-gray-500">
          {new Date(pr.created_at).toLocaleDateString()}
        </span>
      </div>
      {#if pr.labels && pr.labels.length > 0}
        <div class="mt-2 flex flex-wrap gap-1">
          {#each pr.labels as label}
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style="background-color: #{label.color}20; color: #{label.color}"
            >
              {label.name}
            </span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
