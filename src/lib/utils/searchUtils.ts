import Fuse from "fuse.js";
import type { GitHubPR } from "$lib/types";

const fuseOptions = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "number", weight: 0.2 },
    { name: "base.ref", weight: 0.2 },
    { name: "labels.name", weight: 0.2 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 1,
};

let fuse: Fuse<GitHubPR> | null = null;

export function initializeSearch(allPRs: GitHubPR[]): void {
  fuse = new Fuse(allPRs, fuseOptions);
}

export function searchPRs(allPRs: GitHubPR[], searchTerm: string): GitHubPR[] {
  if (!searchTerm.trim()) {
    return allPRs;
  }

  if (!fuse) {
    initializeSearch(allPRs);
  }

  if (!fuse) {
    return allPRs;
  }

  const results = fuse.search(searchTerm);
  return results.map((result) => result.item);
}

export function updateSearchIndex(allPRs: GitHubPR[]): void {
  fuse = new Fuse(allPRs, fuseOptions);
}
