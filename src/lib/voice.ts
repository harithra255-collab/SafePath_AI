import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "./i18n";
import { LOCATIONS, type ServiceKind } from "@/data/safepath";

/* ------------------------------------------------------------------ *
 * Language support. English is the primary language today; the other
 * entries are wired up so additional languages can be enabled later.
 * ------------------------------------------------------------------ */
export const VOICE_LOCALES: Record<Lang, string> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
};

export function voiceLocale(lang: Lang) {
  return VOICE_LOCALES[lang] ?? "en-IN";
}

/* ------------------------------------------------------------------ *
 * Speech synthesis
 * ------------------------------------------------------------------ */
export function speak(text: string, opts?: { enabled?: boolean; lang?: string; interrupt?: boolean }) {
  if (opts?.enabled === false) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    if (opts?.interrupt) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts?.lang ?? "en-IN";
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ *
 * Speech recognition hook
 * ------------------------------------------------------------------ */
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type RecognitionState = {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interim: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
};

export function useSpeechRecognition({
  lang = "en-IN",
  onFinal,
}: {
  lang?: string;
  onFinal?: (text: string) => void;
} = {}): RecognitionState {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef(onFinal);
  finalRef.current = onFinal;

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setError("unsupported");
      return;
    }
    setError(null);
    setTranscript("");
    setInterim("");

    // Ask for microphone permission explicitly so the user sees a clear prompt.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((tr) => tr.stop());
      }
    } catch {
      setError("permission");
      setListening(false);
      return;
    }

    stopSpeaking();
    try {
      recRef.current?.abort();
    } catch {
      /* ignore */
    }

    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onresult = (e: any) => {
      let final = "";
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) final += res[0].transcript;
        else partial += res[0].transcript;
      }
      if (partial) setInterim(partial);
      if (final) {
        const text = final.trim();
        setTranscript(text);
        setInterim("");
        finalRef.current?.(text);
      }
    };
    rec.onerror = (e: any) => {
      const code = e?.error ?? "error";
      setError(code === "not-allowed" || code === "service-not-allowed" ? "permission" : code);
      setListening(false);
    };
    rec.onend = () => setListening(false);

    try {
      rec.start();
      setListening(true);
    } catch {
      setError("busy");
      setListening(false);
    }
  }, [lang]);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return { supported, listening, transcript, interim, error, start, stop, reset };
}

/* ------------------------------------------------------------------ *
 * Command parsing
 * ------------------------------------------------------------------ */
export type VoiceIntent =
  | { type: "destination"; locationId: string; label: string }
  | { type: "nearest"; kind: ServiceKind; label: string }
  | { type: "home" }
  | { type: "report" }
  | { type: "emergency" }
  | { type: "sos" }
  | { type: "stop" }
  | { type: "cancel" }
  | { type: "repeat" }
  | { type: "unknown"; text: string };

const SERVICE_WORDS: { kind: ServiceKind; words: string[]; label: string }[] = [
  { kind: "hospital", words: ["hospital", "clinic", "emergency room"], label: "hospital" },
  { kind: "police", words: ["police", "police station", "cop"], label: "police station" },
  { kind: "pharmacy", words: ["pharmacy", "pharmacies", "medical shop", "chemist"], label: "pharmacy" },
  { kind: "fuel", words: ["fuel", "petrol", "gas station"], label: "fuel station" },
  { kind: "fire", words: ["fire station", "fire"], label: "fire station" },
  { kind: "shelter", words: ["shelter", "safe house"], label: "shelter" },
  { kind: "ambulance", words: ["ambulance"], label: "ambulance" },
];

export function parseVoiceCommand(raw: string): VoiceIntent {
  const text = raw.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return { type: "unknown", text: raw };

  if (/\b(start sos|trigger sos|sos|panic)\b/.test(text)) return { type: "sos" };
  if (/\b(call emergency|call police|call ambulance|emergency call|call 112|call 100)\b/.test(text))
    return { type: "emergency" };
  if (/\b(report (an )?incident|report a problem|file a report)\b/.test(text)) return { type: "report" };
  if (/\b(stop navigation|end navigation|stop navigating|stop guidance)\b/.test(text))
    return { type: "stop" };
  if (/\b(cancel route|cancel navigation|clear route|cancel trip)\b/.test(text))
    return { type: "cancel" };
  if (/\b(repeat|say (that )?again)\b/.test(text)) return { type: "repeat" };
  if (/\b(navigate home|take me home|go home|drive home)\b/.test(text)) return { type: "home" };

  // "nearest / nearby <service>"
  if (/\b(nearest|nearby|closest|near me|around me|show)\b/.test(text)) {
    for (const s of SERVICE_WORDS) {
      if (s.words.some((w) => text.includes(w))) {
        return { type: "nearest", kind: s.kind, label: s.label };
      }
    }
  }

  // destination match
  const cleaned = text
    .replace(
      /\b(take me to|navigate to|navigate|go to|drive to|find the safest route to|safest route to|find the route to|route to|directions to|show me|find|please|the)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  const target = cleaned || text;
  let best: { id: string; name: string; score: number } | null = null;
  for (const loc of LOCATIONS) {
    const hay = `${loc.name} ${loc.city} ${loc.tags.join(" ")}`.toLowerCase();
    const name = loc.name.toLowerCase();
    let score = 0;
    if (target && (hay.includes(target) || target.includes(name))) score = 100 + name.length;
    else {
      const tokens = target.split(" ").filter((w) => w.length > 3);
      const hits = tokens.filter((w) => hay.includes(w)).length;
      if (hits) score = hits * 10;
    }
    if (score > 0 && (!best || score > best.score)) best = { id: loc.id, name: loc.name, score };
  }
  if (best) return { type: "destination", locationId: best.id, label: best.name };

  // service without "nearest"
  for (const s of SERVICE_WORDS) {
    if (s.words.some((w) => text.includes(w))) return { type: "nearest", kind: s.kind, label: s.label };
  }

  return { type: "unknown", text: raw };
}

export const VOICE_EXAMPLES = [
  "Take me to the nearest hospital",
  "Navigate to the nearest police station",
  "Find the safest route to Chennai Central",
  "Navigate home",
  "Show nearby pharmacies",
  "Report an incident",
  "Call emergency",
  "Start SOS",
  "Stop navigation",
  "Cancel route",
];

/* ------------------------------------------------------------------ *
 * Turn-by-turn voice guidance script
 * ------------------------------------------------------------------ */
export type GuidanceCue = { at: number; text: string; tone: "info" | "warn" | "danger" | "success" };

export function guidanceScript(riskAhead: boolean): GuidanceCue[] {
  return [
    { at: 0.04, text: "Starting navigation. Continue straight.", tone: "info" },
    { at: 0.18, text: "Turn left in 100 meters.", tone: "info" },
    { at: 0.32, text: "Continue straight. Road ahead is well lit.", tone: "info" },
    ...(riskAhead
      ? ([
          { at: 0.46, text: "Caution: Moderate-risk area ahead.", tone: "warn" },
        ] as GuidanceCue[])
      : []),
    { at: 0.6, text: "Heavy crowd detected ahead. Reduce speed.", tone: "warn" },
    { at: 0.72, text: "Alternative safer route available.", tone: "info" },
    { at: 0.9, text: "In 200 meters, turn right.", tone: "info" },
    { at: 1, text: "You have reached your destination.", tone: "success" },
  ];
}

export const DANGER_ANNOUNCEMENT =
  "Warning! A high-risk area is ahead. A safer alternative route has been found. Would you like to switch?";

/* SOS can be triggered from anywhere (e.g. a voice command). */
export const SOS_EVENT = "safepath:sos";
export function triggerSos() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SOS_EVENT));
}
