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

export function getApiBaseUrl(configValue: any): string {
  if (configValue.enterpriseUrl) {
    return configValue.enterpriseUrl.replace(/\/$/, "") + "/api/v3";
  }
  return "https://api.github.com";
}

export async function loadUser(configValue: any): Promise<void> {
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
  } catch (error) {
    console.error("Error loading user:", error);
  }
}

export async function loadPRs(
  page: number = 1,
  configValue: any,
  currentUserValue: any,
  searchTermValue: string
): Promise<void> {
  if (!currentUserValue?.login) {
    console.error("No current user available");
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
    currentPage.set(page);

    const totalCount = searchResult.total_count || 0;
    const totalPagesCount = Math.ceil(totalCount / perPage);
    totalPages.set(totalPagesCount);
    totalPRs.set(totalCount);
  } catch (error) {
    console.error("Error loading PRs:", error);
  } finally {
    isLoading.set(false);
  }
}

export async function getAllUserPRs(
  configValue: any,
  currentUserValue: any,
  searchTermValue: string
): Promise<any[]> {
  if (!currentUserValue?.login) {
    console.error("No current user available");
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
    console.error("Error loading all user PRs:", error);
    return [];
  }
}
