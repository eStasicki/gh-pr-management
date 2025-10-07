import { writable } from "svelte/store";
import type { GitHubPR, GitHubUser } from "$lib/types";

export const prs = writable<GitHubPR[]>([]);
export const currentUser = writable<GitHubUser | null>(null);
export const selectedPRs = writable<number[]>([]);
export const isLoading = writable<boolean>(false);
