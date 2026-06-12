import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("app-theme") as Theme) || "light";
  });

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;

    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      // light — força remoção mesmo que o SO seja escuro
      root.classList.remove("dark");
    }
  };

  const setTheme = (t: Theme) => {
    localStorage.setItem("app-theme", t);
    setThemeState(t);
  };

  // Aplica no mount (por segurança, caso o script do index.html não tenha corrido)
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Escuta mudanças do sistema quando theme === 'system'
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      document.documentElement.classList.toggle("dark", mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
