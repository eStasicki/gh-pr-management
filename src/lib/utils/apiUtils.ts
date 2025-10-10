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
import { PER_PAGE } from "$lib/consts";
import { apiCache } from "./apiCache";

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
    currentUser.set(mockCurrentUser);
    return;
  }

  try {
    const url = `${getApiBaseUrl(configValue)}/user`;
    const user = await apiCache.fetchWithCache(
      url,
      {
        headers: {
          Authorization: `token ${configValue.token}`,
        },
      },
      10 * 60 * 1000
    ); // Cache na 10 minut

    currentUser.set(user);
  } catch (error) {
    console.error("Failed to load user:", error);
  }
}

export async function loadPRs(
  configValue: any,
  currentUserValue: any,
  page: number = 1
): Promise<void> {
  if (isDemoMode()) {
    isLoading.set(true);

    if (!mockPRsGenerated) {
      mockPRsCache = generateMockPRs(50);
      mockPRsGenerated = true;
    }

    const perPage = PER_PAGE;
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
    const perPage = PER_PAGE;
    const searchQuery = `repo:${configValue.owner}/${configValue.repo} is:pr is:open author:${currentUserValue.login}`;
    const url = `${getApiBaseUrl(
      configValue
    )}/search/issues?q=${encodeURIComponent(
      searchQuery
    )}&page=${page}&per_page=${perPage}`;

    const searchResult = await apiCache.fetchWithCache(
      url,
      {
        headers: {
          Authorization: `token ${configValue.token}`,
        },
      },
      2 * 60 * 1000
    ); // Cache na 2 minuty

    const searchItems = searchResult.items || [];

    const prsData = await Promise.all(
      searchItems.map(async (item: any) => {
        const prUrl = `${getApiBaseUrl(configValue)}/repos/${
          configValue.owner
        }/${configValue.repo}/pulls/${item.number}`;

        try {
          return await apiCache.fetchWithCache(
            prUrl,
            {
              headers: {
                Authorization: `token ${configValue.token}`,
              },
            },
            5 * 60 * 1000
          ); // Cache na 5 minut
        } catch (error) {
          console.error(`Failed to fetch PR ${item.number}:`, error);
          return null;
        }
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
    console.error("Failed to load PRs:", error);
    isLoading.set(false);
  }
}

export async function getAllUserPRs(
  configValue: any,
  currentUserValue: any,
  limit: number = 50
): Promise<any[]> {
  if (isDemoMode()) {
    if (!mockPRsGenerated) {
      mockPRsCache = generateMockPRs(50);
      mockPRsGenerated = true;
    }

    return mockPRsCache;
  }

  if (!currentUserValue?.login) {
    console.error(`[getAllUserPRs] No currentUserValue.login available!`);
    return [];
  }

  try {
    const allPRs = [];
    let page = 1;
    const perPage = Math.min(limit, 100); // Maksymalnie 100 na stronę
    const maxPages = Math.ceil(limit / perPage);

    while (page <= maxPages) {
      const searchQuery = `repo:${configValue.owner}/${configValue.repo} is:pr is:open author:${currentUserValue.login}`;
      const url = `${getApiBaseUrl(
        configValue
      )}/search/issues?q=${encodeURIComponent(
        searchQuery
      )}&page=${page}&per_page=${perPage}&sort=updated&order=desc`;

      const searchResult = await apiCache.fetchWithCache(
        url,
        {
          headers: {
            Authorization: `token ${configValue.token}`,
          },
        },
        2 * 60 * 1000
      ); // Cache na 2 minuty

      const prsData = searchResult.items || [];

      if (prsData.length === 0) break;

      const prs = await Promise.all(
        prsData.map(async (item: any) => {
          const prUrl = `${getApiBaseUrl(configValue)}/repos/${
            configValue.owner
          }/${configValue.repo}/pulls/${item.number}`;

          try {
            return await apiCache.fetchWithCache(
              prUrl,
              {
                headers: {
                  Authorization: `token ${configValue.token}`,
                },
              },
              5 * 60 * 1000
            ); // Cache na 5 minut
          } catch (error) {
            console.error(`Failed to fetch PR ${item.number}:`, error);
            return null;
          }
        })
      );

      const validPRs = prs.filter((pr) => pr !== null);
      allPRs.push(...validPRs);

      if (prsData.length < perPage || allPRs.length >= limit) break;
      page++;
    }

    const result = allPRs.slice(0, limit);
    return result;
  } catch (error) {
    console.error("Failed to get all user PRs:", error);
    return [];
  }
}

export async function getLabels(
  configValue: any,
  limit: number = 50
): Promise<Array<{ name: string; color: string }>> {
  if (isDemoMode()) {
    return [
      { name: "bug", color: "d73a4a" },
      { name: "enhancement", color: "a2eeef" },
      { name: "documentation", color: "0075ca" },
      { name: "good first issue", color: "7057ff" },
      { name: "help wanted", color: "008672" },
      { name: "priority: high", color: "ff0000" },
      { name: "priority: medium", color: "ffa500" },
      { name: "priority: low", color: "00ff00" },
      { name: "status: in-progress", color: "fbca04" },
      { name: "status: review", color: "0e8a16" },
    ];
  }

  if (!configValue.owner || !configValue.repo || !configValue.token) {
    return [];
  }

  try {
    const labels: Array<{ name: string; color: string }> = [];
    let page = 1;
    const perPage = Math.min(limit, 100);
    const maxPages = Math.ceil(limit / perPage);

    while (page <= maxPages) {
      const url = `${getApiBaseUrl(configValue)}/repos/${configValue.owner}/${
        configValue.repo
      }/labels?page=${page}&per_page=${perPage}`;

      const labelsData = await apiCache.fetchWithCache(
        url,
        {
          headers: {
            Authorization: `token ${configValue.token}`,
          },
        },
        10 * 60 * 1000
      ); // Cache na 10 minut

      if (labelsData.length === 0) break;

      labels.push(
        ...labelsData.map((label: any) => ({
          name: label.name,
          color: label.color,
        }))
      );

      if (labelsData.length < perPage || labels.length >= limit) break;
      page++;
    }

    return labels.slice(0, limit);
  } catch (error) {
    console.error("Failed to get labels:", error);
    return [];
  }
}

export async function getBranches(
  configValue: any,
  limit: number = 30
): Promise<string[]> {
  if (isDemoMode()) {
    return [
      "main",
      "develop",
      "feature/new-feature",
      "bugfix/fix-auth",
      "hotfix/security-patch",
      "release/v1.2.0",
    ];
  }

  if (!configValue.owner || !configValue.repo || !configValue.token) {
    return [];
  }

  try {
    const branches: string[] = [];
    let page = 1;
    const perPage = Math.min(limit, 100);
    const maxPages = Math.ceil(limit / perPage);

    while (page <= maxPages) {
      const url = `${getApiBaseUrl(configValue)}/repos/${configValue.owner}/${
        configValue.repo
      }/branches?page=${page}&per_page=${perPage}&protected=false`;

      const branchesData = await apiCache.fetchWithCache(
        url,
        {
          headers: {
            Authorization: `token ${configValue.token}`,
          },
        },
        15 * 60 * 1000
      ); // Cache na 15 minut

      if (branchesData.length === 0) break;

      branches.push(...branchesData.map((branch: any) => branch.name));

      if (branchesData.length < perPage || branches.length >= limit) break;
      page++;
    }

    return branches.slice(0, limit);
  } catch (error) {
    console.error("Failed to get branches:", error);
    return [];
  }
}

export function getCacheInfo() {
  if (isDemoMode()) {
    return {
      size: 15, // Mock cache size
      rateLimit: {
        remaining: 4500,
        reset: Date.now() + 1800000, // 30 minut od teraz
        used: 500,
      },
    };
  }

  return {
    size: apiCache.getCacheSize(),
    rateLimit: apiCache.getRateLimitInfo(),
  };
}

export function clearCache() {
  apiCache.clear();
}
