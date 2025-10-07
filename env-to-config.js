const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, "utf8");
    const config = {};

    envContent.split("\n").forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          config[key] = value;
        }
      }
    });

    return config;
  } catch (error) {
    console.log("No .env file found or error reading it:", error.message);
    return {};
  }
}

function createConfigFromEnv() {
  const envConfig = parseEnvFile(".env");

  const config = {
    github_token: envConfig.GITHUB_TOKEN || "",
    repo_owner: envConfig.REPO_OWNER || "",
    repo_name: envConfig.REPO_NAME || "",
    github_enterprise_url: envConfig.GITHUB_ENTERPRISE_URL || "",
  };

  fs.writeFileSync("config.json", JSON.stringify(config, null, 2));
  console.log("config.json created from .env file");
}

if (require.main === module) {
  createConfigFromEnv();
}

module.exports = { parseEnvFile, createConfigFromEnv };
