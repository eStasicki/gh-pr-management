const fs = require("fs");
const path = require("path");

// Read .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  const env = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          env[key] = value;
        }
      }
    });
  }

  return env;
}

// Generate config.json
function generateConfig() {
  const env = loadEnvFile();

  const config = {
    github_token: env.VITE_GITHUB_TOKEN || "",
    repo_owner: env.VITE_REPO_OWNER || "",
    repo_name: env.VITE_REPO_NAME || "",
    github_enterprise_url: env.VITE_GITHUB_ENTERPRISE_URL || "",
  };

  fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
  console.log("Generated config.json from .env");
  console.log("Config:", {
    token: config.github_token ? "***" : "empty",
    owner: config.repo_owner || "empty",
    repo: config.repo_name || "empty",
    enterpriseUrl: config.github_enterprise_url || "empty",
  });
}

generateConfig();
