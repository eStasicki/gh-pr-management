import { writable } from "svelte/store";
import { githubAPI } from "$lib/services/github-api";

export interface Label {
  name: string;
  color: string;
}

export const labels = writable<Label[]>([]);
export const isLoadingLabels = writable<boolean>(false);
export const labelsError = writable<string | null>(null);

export async function loadLabels() {
  isLoadingLabels.set(true);
  labelsError.set(null);

  try {
    const labelsData = await githubAPI.getLabels();
    labels.set(labelsData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load labels";
    labelsError.set(errorMessage);
    console.error("Error loading labels:", error);
  } finally {
    isLoadingLabels.set(false);
  }
}

export async function refreshLabels() {
  await loadLabels();
}
