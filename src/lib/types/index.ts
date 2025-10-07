export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  enterpriseUrl: string;
}

export interface GitHubUser {
  login: string;
  name?: string;
  id: number;
  avatar_url: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  user: GitHubUser;
  base: {
    ref: string;
  };
  labels: GitHubLabel[];
}

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}
