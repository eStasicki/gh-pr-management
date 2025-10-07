import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  // Configuration is now handled client-side via localStorage
  return { config: { token: "", owner: "", repo: "", enterpriseUrl: "" } };
};