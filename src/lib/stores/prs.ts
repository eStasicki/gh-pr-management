import { writable } from "svelte/store";
import { browser } from "$app/environment";
import type { GitHubPR, GitHubUser } from "$lib/types";
import { get } from "svelte/store";

export const prs = writable<GitHubPR[]>([]);
export const currentUser = writable<GitHubUser | null>(null);
export const isLoading = writable<boolean>(false);
export const currentPage = writable<number>(1);
export const totalPages = writable<number>(0);
export const totalPRs = writable<number>(0);
export const searchTerm = writable<string>("");

// Load selected PRs from localStorage on initialization
const getStoredSelectedPRs = (): number[] => {
  if (browser) {
    try {
      const stored = localStorage.getItem("selectedPRs");
      const parsed = stored ? JSON.parse(stored) : [];
      return parsed;
    } catch (error) {
      return [];
    }
  }
  return [];
};

export const selectedPRs = writable<number[]>(getStoredSelectedPRs());

// Subscribe to selectedPRs changes and save to localStorage
if (browser) {
  selectedPRs.subscribe((value) => {
    try {
      localStorage.setItem("selectedPRs", JSON.stringify(value));
    } catch (error) {}
  });
}

// Function to update specific PRs in the store
export function updatePRs(prNumbers: number[], updates: Partial<GitHubPR>) {
  prs.update((currentPRs) => {
    return currentPRs.map((pr) => {
      if (prNumbers.includes(pr.number)) {
        return { ...pr, ...updates };
      }
      return pr;
    });
  });
}
