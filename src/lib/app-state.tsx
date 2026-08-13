import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DICTS, type Dict, type Lang } from "./i18n";

export type ThemeMode = "light" | "dark" | "auto";
export type FontScale = "sm" | "md" | "lg";

export type IncidentReport = {
  id: string;
  category: string;
  severity: "low" | "medium" | "high";
  description: string;
  place: string;
  photo?: string;
  createdAt: number;
};

type State = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  isDark: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
  offline: boolean;
  setOffline: (v: boolean) => void;
  fontScale: FontScale;
  setFontScale: (f: FontScale) => void;
  voiceNav: boolean;
  setVoiceNav: (v: boolean) => void;
  sound: boolean;
  setSound: (v: boolean) => void;
  reports: IncidentReport[];
  addReport: (r: Omit<IncidentReport, "id" | "createdAt">) => void;
  recentSearches: string[];
  pushSearch: (s: string) => void;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
};

const Ctx = createContext<State | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [lang, setLangState] = useState<Lang>("en");
  const [offline, setOffline] = useState(false);
  const [fontScale, setFontScaleState] = useState<FontScale>("md");
  const [voiceNav, setVoiceNavState] = useState(true);
  const [sound, setSoundState] = useState(true);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [recentSearches, setRecent] = useState<string[]>([]);
  const [onboarded, setOnboardedState] = useState(true);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    setThemeState(read<ThemeMode>("sp.theme", "light"));
    setLangState(read<Lang>("sp.lang", "en"));
    setOffline(read("sp.offline", false));
    setFontScaleState(read<FontScale>("sp.font", "md"));
    setVoiceNavState(read("sp.voice", true));
    setSoundState(read("sp.sound", true));
    setReports(read<IncidentReport[]>("sp.reports", []));
    setRecent(read<string[]>("sp.recent", []));
    setOnboardedState(read("sp.onboarded", false));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    setHydrated(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isDark = theme === "dark" || (theme === "auto" && systemDark);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.fontSize =
      fontScale === "sm" ? "14px" : fontScale === "lg" ? "18px" : "16px";
  }, [isDark, fontScale, hydrated]);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    write("sp.theme", t);
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    write("sp.lang", l);
  }, []);
  const setFontScale = useCallback((f: FontScale) => {
    setFontScaleState(f);
    write("sp.font", f);
  }, []);
  const setVoiceNav = useCallback((v: boolean) => {
    setVoiceNavState(v);
    write("sp.voice", v);
  }, []);
  const setSound = useCallback((v: boolean) => {
    setSoundState(v);
    write("sp.sound", v);
  }, []);
  const setOnboarded = useCallback((v: boolean) => {
    setOnboardedState(v);
    write("sp.onboarded", v);
  }, []);
  const setOfflineP = useCallback((v: boolean) => {
    setOffline(v);
    write("sp.offline", v);
  }, []);

  const addReport = useCallback((r: Omit<IncidentReport, "id" | "createdAt">) => {
    setReports((prev) => {
      const next = [
        { ...r, id: `r-${Date.now()}`, createdAt: Date.now() },
        ...prev,
      ].slice(0, 50);
      write("sp.reports", next);
      return next;
    });
  }, []);

  const pushSearch = useCallback((s: string) => {
    setRecent((prev) => {
      const next = [s, ...prev.filter((x) => x !== s)].slice(0, 8);
      write("sp.recent", next);
      return next;
    });
  }, []);

  const value = useMemo<State>(
    () => ({
      theme,
      setTheme,
      isDark,
      lang,
      setLang,
      t: DICTS[lang],
      offline,
      setOffline: setOfflineP,
      fontScale,
      setFontScale,
      voiceNav,
      setVoiceNav,
      sound,
      setSound,
      reports,
      addReport,
      recentSearches,
      pushSearch,
      onboarded,
      setOnboarded,
    }),
    [
      theme,
      setTheme,
      isDark,
      lang,
      setLang,
      offline,
      setOfflineP,
      fontScale,
      setFontScale,
      voiceNav,
      setVoiceNav,
      sound,
      setSound,
      reports,
      addReport,
      recentSearches,
      pushSearch,
      onboarded,
      setOnboarded,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppStateProvider");
  return ctx;
}

export function playBeep(enabled: boolean, freq = 660, ms = 90) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
    setTimeout(() => void ctx.close(), ms + 120);
  } catch {
    /* ignore */
  }
}
