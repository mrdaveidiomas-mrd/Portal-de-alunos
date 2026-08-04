"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "portal-theme";

// Store externo simples: a fonte de verdade do tema é o atributo
// <html data-theme>, já aplicado antes da hidratação pelo script inline do
// layout. Lemos via useSyncExternalStore para evitar setState em efeito (o
// React 19 desaconselha) e para casar a hidratação sem flash.
const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Janela em que aplicamos a classe `theme-transitioning` no <html>.
// Casado com a duration usada em globals.css (250ms) + folga.
const THEME_TRANSITION_MS = 320;
let transitionTimer: ReturnType<typeof setTimeout> | null = null;

function setThemeGlobal(theme: Theme) {
  const html = document.documentElement;
  // Ativa transição suave APENAS durante a troca — fora dessa janela os
  // demais hover/focus mantêm suas próprias durations.
  html.classList.add("theme-transitioning");
  if (transitionTimer) clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => {
    html.classList.remove("theme-transitioning");
    transitionTimer = null;
  }, THEME_TRANSITION_MS);

  html.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage indisponível (modo privado) — ignora silenciosamente.
  }
  listeners.forEach((listener) => listener());
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    () => "light" as Theme,
  );

  const setTheme = useCallback((next: Theme) => setThemeGlobal(next), []);
  const toggleTheme = useCallback(
    () => setThemeGlobal(readTheme() === "dark" ? "light" : "dark"),
    [],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de <ThemeProvider>");
  }
  return context;
}
