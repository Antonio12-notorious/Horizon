import { createContext, useContext, useEffect, useState } from "react";

export type AccentColor =
  | "violet"
  | "blue"
  | "emerald"
  | "rose"
  | "orange"
  | "slate";

export const ACCENT_COLORS: Record<
  AccentColor,
  {
    label: string;
    hex: string;
    light: string; // CSS vars for light shade (used in /10 etc)
  }
> = {
  violet: { label: "Violeta", hex: "#7c3aed", light: "124 58 237" },
  blue: { label: "Azul", hex: "#2563eb", light: "37 99 235" },
  emerald: { label: "Verde", hex: "#059669", light: "5 150 105" },
  rose: { label: "Rosa", hex: "#e11d48", light: "225 29 72" },
  orange: { label: "Laranja", hex: "#ea580c", light: "234 88 12" },
  slate: { label: "Cinzento", hex: "#475569", light: "71 85 105" },
};

interface AccentContextType {
  accent: AccentColor;
  setAccent: (color: AccentColor) => void;
}

const AccentContext = createContext<AccentContextType | undefined>(undefined);

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>(() => {
    return (localStorage.getItem("app-accent") as AccentColor) || "violet";
  });

  const setAccent = (color: AccentColor) => {
    setAccentState(color);
    localStorage.setItem("app-accent", color);
  };

  useEffect(() => {
    const { hex, light } = ACCENT_COLORS[accent];
    const root = document.documentElement;
    // Tailwind v4 usa CSS vars directamente
    root.style.setProperty("--color-primary", hex);
    root.style.setProperty("--color-primary-rgb", light);
  }, [accent]);

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export const useAccent = () => {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error("useAccent must be used within AccentProvider");
  return ctx;
};
