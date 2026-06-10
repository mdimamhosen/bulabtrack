import { useEffect, useState, type ReactNode } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isLight = saved === "light";
    document.documentElement.classList.toggle("light", isLight);
    document.documentElement.classList.toggle("dark", !isLight);
  }, []);
  return <>{children}</>;
}

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);
  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    document.documentElement.classList.toggle("dark", !next);
    localStorage.setItem("theme", next ? "light" : "dark");
  };
  return (
    <button
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-secondary"
      aria-label="Toggle theme"
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
