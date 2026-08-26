import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LOCATIONS, type SafePathLocation } from "@/data/safepath";

type TripState = {
  dest: SafePathLocation | null;
  setDestId: (id: string | null) => void;
  setDestination: (destination: SafePathLocation | null) => void;
};

const Ctx = createContext<TripState | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [destId, setDestIdState] = useState<string | null>(null);
  const [customDestination, setCustomDestination] = useState<SafePathLocation | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("sp.dest");
    if (saved) setDestIdState(saved);
    const savedCustom = window.localStorage.getItem("sp.custom-dest");
    if (savedCustom) {
      try {
        setCustomDestination(JSON.parse(savedCustom) as SafePathLocation);
      } catch {
        window.localStorage.removeItem("sp.custom-dest");
      }
    }
  }, []);

  const value = useMemo<TripState>(
    () => ({
      dest: customDestination ?? LOCATIONS.find((l) => l.id === destId) ?? null,
      setDestId: (id) => {
        setCustomDestination(null);
        setDestIdState(id);
        if (id) window.localStorage.setItem("sp.dest", id);
        else window.localStorage.removeItem("sp.dest");
      },
      setDestination: (destination) => {
        setCustomDestination(destination);
        setDestIdState(null);
        if (destination) window.localStorage.setItem("sp.custom-dest", JSON.stringify(destination));
        else window.localStorage.removeItem("sp.custom-dest");
      },
    }),
    [customDestination, destId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrip() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTrip must be used inside TripProvider");
  return ctx;
}
