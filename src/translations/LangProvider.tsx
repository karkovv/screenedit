import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Lang, StringKey } from "./strings";
import { strings } from "./strings";

interface LangContextValue {
  lang: Lang;
  toggle: () => void;
  t: (key: StringKey) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() =>
    navigator.language?.startsWith("ru") ? "ru" : "en",
  );

  const toggle = useCallback(() => {
    setLang((l) => (l === "en" ? "ru" : "en"));
  }, []);

  const t = useCallback((key: StringKey): string => {
    return strings[key]?.[lang] ?? key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
