import { config } from "$lib/stores";
import { get } from "svelte/store";

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  state: string;
  base: {
    ref: string;
  };
  head: {
    ref: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  user: {
    login: string;
    name?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface GitHubUser {
  login: string;
  name?: string;
  email?: string;
}

class GitHubAPI {
  private getApiBaseUrl(): string {
    const currentConfig = get(config);
    if (currentConfig.enterpriseUrl) {
      return currentConfig.enterpriseUrl.replace(/\/$/, "") + "/api/v3";
    }
    return "https://api.github.com";
  }

  private getHeaders(): HeadersInit {
    const currentConfig = get(config);
    return {
      Authorization: `token ${currentConfig.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "GitHub-PR-Management",
    };
  }

  async validateAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/user`, {
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getUser(): Promise<GitHubUser> {
    const response = await fetch(`${this.getApiBaseUrl()}/user`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return response.json();
  }

  async getPRs(): Promise<GitHubPR[]> {
    const currentConfig = get(config);
    const response = await fetch(
      `${this.getApiBaseUrl()}/repos/${currentConfig.owner}/${
        currentConfig.repo
      }/pulls?state=open&per_page=100`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch PRs: ${response.statusText}`);
    }

    return response.json();
  }

  async updatePRBase(prNumber: number, newBase: string): Promise<void> {
    const currentConfig = get(config);
    const response = await fetch(
      `${this.getApiBaseUrl()}/repos/${currentConfig.owner}/${
        currentConfig.repo
      }/pulls/${prNumber}`,
      {
        method: "PATCH",
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base: newBase,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to update PR base: ${response.statusText} - ${error}`
      );
    }
  }

  async addLabelsToPR(prNumber: number, labels: string[]): Promise<void> {
    const currentConfig = get(config);
    const response = await fetch(
      `${this.getApiBaseUrl()}/repos/${currentConfig.owner}/${
        currentConfig.repo
      }/issues/${prNumber}/labels`,
      {
        method: "POST",
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          labels: labels,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to add labels: ${response.statusText} - ${error}`
      );
    }
  }

  async removeLabelsFromPR(prNumber: number, labels: string[]): Promise<void> {
    const currentConfig = get(config);

    // GitHub API requires removing labels one by one
    for (const label of labels) {
      const response = await fetch(
        `${this.getApiBaseUrl()}/repos/${currentConfig.owner}/${
          currentConfig.repo
        }/issues/${prNumber}/labels/${encodeURIComponent(label)}`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok && response.status !== 404) {
        const error = await response.text();
        throw new Error(
          `Failed to remove label ${label}: ${response.statusText} - ${error}`
        );
      }
    }
  }

  async updateAllPRsBase(
    newBase: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const prs = await this.getPRs();
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const pr of prs) {
      try {
        await this.updatePRBase(pr.number, newBase);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `PR #${pr.number}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return results;
  }

  async updatePRsBaseAndLabels(
    newBase: string,
    labels: string[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const prs = await this.getPRs();
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const pr of prs) {
      try {
        // Update base branch
        await this.updatePRBase(pr.number, newBase);

        // Add labels
        if (labels.length > 0) {
          await this.addLabelsToPR(pr.number, labels);
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `PR #${pr.number}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return results;
  }

  async manageLabelsOnAllPRs(
    action: "add" | "remove",
    labels: string[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const prs = await this.getPRs();
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const pr of prs) {
      try {
        if (action === "add") {
          await this.addLabelsToPR(pr.number, labels);
        } else {
          await this.removeLabelsFromPR(pr.number, labels);
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `PR #${pr.number}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return results;
  }

  async getBranches(): Promise<string[]> {
    const currentConfig = get(config);
    const branches: string[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `${this.getApiBaseUrl()}/repos/${currentConfig.owner}/${
          currentConfig.repo
        }/branches?page=${page}&per_page=${perPage}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.statusText}`);
      }

      const branchData = await response.json();
      if (branchData.length === 0) break;

      branches.push(...branchData.map((branch: any) => branch.name));

      if (branchData.length < perPage) break;
      page++;
    }

    return branches;
  }

  async getLabels(): Promise<Array<{ name: string; color: string }>> {
    const currentConfig = get(config);
    const labels: Array<{ name: string; color: string }> = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `${this.getApiBaseUrl()}/repos/${currentConfig.owner}/${
          currentConfig.repo
        }/labels?page=${page}&per_page=${perPage}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch labels: ${response.statusText}`);
      }

      const labelsData = await response.json();
      if (labelsData.length === 0) break;

      labels.push(
        ...labelsData.map((label: any) => ({
          name: label.name,
          color: label.color,
        }))
      );

      if (labelsData.length < perPage) break;
      page++;
    }

    return labels;
  }
}

export const githubAPI = new GitHubAPI();
