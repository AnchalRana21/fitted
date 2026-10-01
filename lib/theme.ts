export type Theme = "light" | "dark";
export const THEME_KEY = "fitted-theme";

export function resolveTheme(stored: string | null, systemDark: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return systemDark ? "dark" : "light";
}

/** Runs before paint (inlined in <head>) so there is no light flash in dark mode. */
export const THEME_SCRIPT = `(function(){var d=false;try{d=window.matchMedia("(prefers-color-scheme: dark)").matches;}catch(e){}try{var s=localStorage.getItem("${THEME_KEY}");var t=s==="light"||s==="dark"?s:(d?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme",d?"dark":"light");}})();`;
