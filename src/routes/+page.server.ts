import { readFileSync } from "fs";
import { join } from "path";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  let config = {
    token: "",
    owner: "",
    repo: "",
    enterpriseUrl: "",
  };

  try {
    const configPath = join(process.cwd(), "config.json");
    const configData = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(configData);
    config = {
      token: parsed.github_token || "",
      owner: parsed.repo_owner || "",
      repo: parsed.repo_name || "",
      enterpriseUrl: parsed.github_enterprise_url || "",
    };
    console.log("Server loaded config:", {
      token: config.token ? "***" : "empty",
      owner: config.owner || "empty",
      repo: config.repo || "empty",
      enterpriseUrl: config.enterpriseUrl || "empty",
    });
  } catch (error) {
    console.log("Failed to load config.json:", error.message);
  }

  return { config };
};
