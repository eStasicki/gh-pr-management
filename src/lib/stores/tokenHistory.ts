import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { encryptToken, decryptToken } from "$lib/utils/encryption";

interface TokenHistoryItem {
  id: string;
  token: string;
  label: string;
  lastUsed: number;
}

const STORAGE_KEY = "gh_token_history";
const MAX_HISTORY_ITEMS = 10;

function loadTokenHistory(): TokenHistoryItem[] {
  if (!browser) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const history = JSON.parse(stored);
      if (Array.isArray(history)) {
        return history.map((item) => ({
          ...item,
          token: decryptToken(item.token),
        }));
      }
    }
  } catch (error) {
    console.error("Failed to load token history:", error);
  }

  return [];
}

function saveTokenHistory(history: TokenHistoryItem[]) {
  if (!browser) return;

  try {
    const encryptedHistory = history.map((item) => ({
      ...item,
      token: encryptToken(item.token),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedHistory));
  } catch (error) {
    console.error("Failed to save token history:", error);
  }
}

export const tokenHistory = writable<TokenHistoryItem[]>(loadTokenHistory());

export function addTokenToHistory(token: string, label?: string) {
  if (!token.trim()) return;

  const trimmedToken = token.trim();
  const tokenLabel = label || `Token ${trimmedToken.substring(0, 8)}...`;

  tokenHistory.update((history) => {
    const existingIndex = history.findIndex(
      (item) => item.token === trimmedToken
    );

    if (existingIndex >= 0) {
      history[existingIndex].lastUsed = Date.now();
      history[existingIndex].label = tokenLabel;
    } else {
      const newItem: TokenHistoryItem = {
        id: Date.now().toString(),
        token: trimmedToken,
        label: tokenLabel,
        lastUsed: Date.now(),
      };

      history.unshift(newItem);
    }

    const sortedHistory = history
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, MAX_HISTORY_ITEMS);

    saveTokenHistory(sortedHistory);
    return sortedHistory;
  });
}

export function removeTokenFromHistory(id: string) {
  tokenHistory.update((history) => {
    const filtered = history.filter((item) => item.id !== id);
    saveTokenHistory(filtered);
    return filtered;
  });
}

export function clearTokenHistory() {
  tokenHistory.set([]);
  if (browser) {
    localStorage.removeItem(STORAGE_KEY);
  }
}
