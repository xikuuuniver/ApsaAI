import { createContext, useContext, useState, ReactNode } from "react";

export type BgTheme = "particles" | "space" | "nature" | "ocean";

interface BgThemeContextType {
  bgTheme: BgTheme;
  setBgTheme: (t: BgTheme) => void;
}

const BgThemeContext = createContext<BgThemeContextType | undefined>(undefined);

export function BgThemeProvider({ children }: { children: ReactNode }) {
  const [bgTheme, setBgThemeState] = useState<BgTheme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("nexus-bg-theme") as BgTheme) || "particles";
    }
    return "particles";
  });

  const setBgTheme = (t: BgTheme) => {
    localStorage.setItem("nexus-bg-theme", t);
    setBgThemeState(t);
  };

  return (
    <BgThemeContext.Provider value={{ bgTheme, setBgTheme }}>
      {children}
    </BgThemeContext.Provider>
  );
}

export function useBgTheme() {
  const ctx = useContext(BgThemeContext);
  if (!ctx) throw new Error("useBgTheme must be used within BgThemeProvider");
  return ctx;
}
