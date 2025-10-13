import { browser } from "$app/environment";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RateLimitInfo {
  remaining: number;
  reset: number;
  used: number;
}

class GitHubAPICache {
  private cache = new Map<string, CacheEntry<any>>();
  private rateLimitInfo: RateLimitInfo | null = {
    remaining: 5000,
    reset: Date.now() + 3600000, // 1 godzina od teraz
    used: 0,
  };
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minut
  private readonly RATE_LIMIT_BUFFER = 10; // Leave 10 requests as buffer

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `${endpoint}:${paramString}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private canMakeRequest(): boolean {
    if (!this.rateLimitInfo) return true;
    return this.rateLimitInfo.remaining > this.RATE_LIMIT_BUFFER;
  }

  private updateRateLimit(headers: Headers): void {
    const remaining = parseInt(headers.get("X-RateLimit-Remaining") || "0");
    const reset = parseInt(headers.get("X-RateLimit-Reset") || "0") * 1000;
    const used = parseInt(headers.get("X-RateLimit-Used") || "0");

    this.rateLimitInfo = { remaining, reset, used };
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    ttl?: number
  ): Promise<T | null> {
    if (!browser) return null;

    const cacheKey = this.getCacheKey(endpoint, params);
    const entry = this.cache.get(cacheKey);

    if (entry && !this.isExpired(entry)) {
      return entry.data;
    }

    return null;
  }

  async set<T>(
    endpoint: string,
    data: T,
    params?: Record<string, any>,
    ttl?: number
  ): Promise<void> {
    if (!browser) return;

    const cacheKey = this.getCacheKey(endpoint, params);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  async fetchWithCache<T>(
    url: string,
    options: RequestInit = {},
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.getCacheKey(url);
    const cached = await this.get<T>(url, undefined, ttl);

    if (cached) {
      return cached;
    }

    if (!this.canMakeRequest()) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Accept: "application/vnd.github.v3+json",
      },
    });

    this.updateRateLimit(response.headers);

    if (!response.ok) {
      if (
        response.status === 403 &&
        response.headers.get("X-RateLimit-Remaining") === "0"
      ) {
        throw new Error(
          "GitHub API rate limit exceeded. Please try again later."
        );
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    await this.set(url, data, undefined, ttl);

    return data;
  }

  clear(): void {
    this.cache.clear();
    this.rateLimitInfo = null;
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const apiCache = new GitHubAPICache();
