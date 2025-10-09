import {
  config,
  currentUser,
  prs,
  isLoading,
  currentPage,
  totalPages,
  totalPRs,
  searchTerm,
} from "$lib/stores";
import { isDemoMode } from "$lib/utils/demoMode";
import { generateMockPRs, mockCurrentUser } from "$lib/mockData";
import { get } from "svelte/store";

// Cache dla mock danych w trybie demo
let mockPRsCache: any[] = [];
let mockPRsGenerated = false;

export function resetMockCache() {
  mockPRsCache = [];
  mockPRsGenerated = false;
}

export function getApiBaseUrl(configValue: any): string {
  if (configValue.enterpriseUrl) {
    return configValue.enterpriseUrl.replace(/\/$/, "") + "/api/v3";
  }
  return "https://api.github.com";
}

export async function loadUser(configValue: any): Promise<void> {
  if (isDemoMode()) {
    // W trybie demo ustaw mock użytkownika
    currentUser.set(mockCurrentUser);
    return;
  }

  try {
    const response = await fetch(`${getApiBaseUrl(configValue)}/user`, {
      headers: {
        Authorization: `token ${configValue.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.ok) {
      const user = await response.json();
      currentUser.set(user);
    }
  } catch (error) {}
}

export async function loadPRs(
  configValue: any,
  currentUserValue: any,
  searchTermValue: string,
  page: number = 1
): Promise<void> {
  if (isDemoMode()) {
    // W trybie demo użyj mock danych z cache
    isLoading.set(true);

    // Generuj mock PR-y tylko raz
    if (!mockPRsGenerated) {
      mockPRsCache = generateMockPRs(50);
      mockPRsGenerated = true;
    }

    const perPage = 20;
    const startIndex = (page - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, mockPRsCache.length);
    const pagePRs = mockPRsCache.slice(startIndex, endIndex);

    const delay = Math.random() * 500 + 500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    prs.set(pagePRs);
    isLoading.set(false);

    const totalPagesCount = Math.ceil(mockPRsCache.length / perPage);
    currentPage.set(page);
    totalPages.set(totalPagesCount);
    totalPRs.set(mockPRsCache.length);

    return;
  }

  if (!currentUserValue?.login) {
    return;
  }

  isLoading.set(true);
  try {
    const perPage = 20;
    let searchQuery = `repo:${configValue.owner}/${configValue.repo} is:pr is:open author:${currentUserValue.login}`;

    if (searchTermValue.trim()) {
      searchQuery += ` ${searchTermValue}`;
    }

    const response = await fetch(
      `${getApiBaseUrl(configValue)}/search/issues?q=${encodeURIComponent(
        searchQuery
      )}&page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `token ${configValue.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const searchResult = await response.json();
    const searchItems = searchResult.items || [];

    const prsData = await Promise.all(
      searchItems.map(async (item: any) => {
        const prResponse = await fetch(
          `${getApiBaseUrl(configValue)}/repos/${configValue.owner}/${
            configValue.repo
          }/pulls/${item.number}`,
          {
            headers: {
              Authorization: `token ${configValue.token}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (prResponse.ok) {
          return await prResponse.json();
        }
        return null;
      })
    );

    const validPRs = prsData.filter((pr) => pr !== null);
    prs.set(validPRs);
    isLoading.set(false);

    const totalCount = searchResult.total_count || 0;
    const totalPagesCount = Math.ceil(totalCount / perPage);

    currentPage.set(page);
    totalPages.set(totalPagesCount);
    totalPRs.set(totalCount);
  } catch (error) {
    isLoading.set(false);
  }
}

export async function getAllUserPRs(
  configValue: any,
  currentUserValue: any,
  searchTermValue: string
): Promise<any[]> {
  if (isDemoMode()) {
    if (!mockPRsGenerated) {
      mockPRsCache = generateMockPRs(50);
      mockPRsGenerated = true;
    }
    return mockPRsCache;
  }

  if (!currentUserValue?.login) {
    return [];
  }

  try {
    const allPRs = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const searchQuery = `repo:${configValue.owner}/${
        configValue.repo
      } is:pr is:open author:${currentUserValue.login}${
        searchTermValue ? ` ${searchTermValue}` : ""
      }`;

      const response = await fetch(
        `${getApiBaseUrl(configValue)}/search/issues?q=${encodeURIComponent(
          searchQuery
        )}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `token ${configValue.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const searchResult = await response.json();
      const prsData = searchResult.items || [];

      if (prsData.length === 0) break;

      const prs = await Promise.all(
        prsData.map(async (item: any) => {
          const prResponse = await fetch(
            `${getApiBaseUrl(configValue)}/repos/${configValue.owner}/${
              configValue.repo
            }/pulls/${item.number}`,
            {
              headers: {
                Authorization: `token ${configValue.token}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          if (prResponse.ok) {
            return await prResponse.json();
          }
          return null;
        })
      );

      const validPRs = prs.filter((pr) => pr !== null);
      allPRs.push(...validPRs);

      if (prsData.length < perPage) break;
      page++;
    }

    return allPRs;
  } catch (error) {
    return [];
  }
}
