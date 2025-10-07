import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [sveltekit()],
    define: {
      "import.meta.env.VITE_GITHUB_TOKEN": JSON.stringify(
        env.VITE_GITHUB_TOKEN
      ),
      "import.meta.env.VITE_REPO_OWNER": JSON.stringify(env.VITE_REPO_OWNER),
      "import.meta.env.VITE_REPO_NAME": JSON.stringify(env.VITE_REPO_NAME),
      "import.meta.env.VITE_GITHUB_ENTERPRISE_URL": JSON.stringify(
        env.VITE_GITHUB_ENTERPRISE_URL
      ),
    },
  };
});
