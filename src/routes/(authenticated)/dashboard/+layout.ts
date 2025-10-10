import { supabaseAuth } from "$lib/stores/supabaseAuth";
import { redirect } from "@sveltejs/kit";

export const load = async ({ url }: { url: URL }) => {
  return {
    url: url.pathname,
  };
};
