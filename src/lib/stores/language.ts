import { writable } from "svelte/store";
import { browser } from "$app/environment";

const storedLanguage = browser
  ? localStorage.getItem("language") || "pl"
  : "pl";

export const language = writable<"pl" | "en">(storedLanguage as "pl" | "en");

if (browser) {
  language.subscribe((value) => {
    localStorage.setItem("language", value);
  });
}
