"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    // Read from attribute set by the inline <head> script
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  });

  // On mount, sync state with DOM attribute
  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("dodo-theme") as Theme | null;
    const resolved: Theme = stored === "dark" ? "dark" : "light";

    root.setAttribute("data-theme", resolved);
    setTheme(resolved);
    localStorage.setItem("dodo-theme", resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    // Read DIRECTLY from DOM attribute to avoid any desync
    const current = root.getAttribute("data-theme");
    const next: Theme = current === "dark" ? "light" : "dark";

    // 1. Start transition
    root.classList.add("theme-transitioning");

    // 2. Apply to DOM attribute (this is what Tailwind dark: classes respond to)
    root.setAttribute("data-theme", next);

    // 3. Sync React state + localStorage
    setTheme(next);
    localStorage.setItem("dodo-theme", next);

    // 4. End transition
    setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 500);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
