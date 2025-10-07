<script lang="ts">
  import { prs, currentUser } from "$lib/stores";
  import type { GitHubPR } from "$lib/types";

  let searchTerm = "";

  $: filteredPRs = $prs.filter((pr: GitHubPR) => {
    // Only show user's PRs
    if (pr.user.login !== $currentUser?.login) return false;

    // Apply search filter
    return (
      pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.number.toString().includes(searchTerm)
    );
  });
</script>

<div class="grid gap-4">
  {#each filteredPRs as pr (pr.number)}
    <div
      class="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 transition-all duration-300 cursor-pointer hover:border-primary-500 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div class="flex justify-between items-start mb-3">
        <div class="font-semibold text-gray-800 text-lg pr-4">
          {pr.title}
        </div>
        <div
          class="bg-primary-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex-shrink-0"
        >
          #{pr.number}
        </div>
      </div>

      <div class="flex gap-4 mb-3 text-sm text-gray-500">
        <span>Base: {pr.base.ref}</span>
        <span class="font-semibold text-primary-600">
          Author: {pr.user.login}
        </span>
        <span
          class="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
        >
          {pr.state.toUpperCase()}
        </span>
        <span>Updated: {new Date(pr.updated_at).toLocaleDateString()}</span>
      </div>

      <div class="flex flex-wrap gap-2">
        {#each pr.labels as label}
          <span
            class="px-2 py-1 rounded-md text-xs font-medium text-white"
            style="background-color: #{label.color}"
          >
            {label.name}
          </span>
        {/each}
      </div>
    </div>
  {/each}
</div>
