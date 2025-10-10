import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { execSync } from "child_process";

const isPortInUse = (port: number): boolean => {
  try {
    execSync(`lsof -i :${port}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const shouldOpenBrowser = (): boolean => {
  if (process.env.NODE_ENV !== "development") return false;

  if (isPortInUse(5173)) return false;

  return true;
};

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    open: shouldOpenBrowser() ? "http://localhost:5173" : false,
    host: true,
    port: 5173,
  },
});
