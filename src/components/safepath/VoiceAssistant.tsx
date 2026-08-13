import { useState } from "react";
import { Mic, MicOff, Keyboard, X, Volume2, Sparkles } from "lucide-react";
import { VOICE_EXAMPLES } from "@/lib/voice";

/** Animated bars shown while the microphone is recording. */
export function ListeningIndicator({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-end gap-0.5" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-current"
          style={{
            height: (compact ? 6 : 10) + (i % 3) * (compact ? 4 : 9),
            animation: `sp-float .7s ${i * 0.09}s ease-in-out infinite`,
          }}
        />
      ))}
    </span>
  );
}

/** Floating voice-assistant button that sits above the bottom navigation. */
export function VoiceFab({
  listening,
  onClick,
  label,
}: {
  listening: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`press fixed bottom-[176px] right-4 z-40 grid h-14 w-14 place-items-center rounded-full shadow-float transition-colors ${
        listening ? "bg-destructive text-destructive-foreground" : "brand-gradient text-white"
      }`}
      style={{ marginRight: "max(0px, calc((100vw - 460px) / 2))" }}
    >
      {listening ? (
        <>
          <span className="absolute inset-0 rounded-full bg-destructive/50 [animation:sp-pulse-ring_1.4s_ease-out_infinite]" />
          <span className="relative">
            <ListeningIndicator compact />
          </span>
        </>
      ) : (
        <Mic className="h-6 w-6" strokeWidth={2.2} />
      )}
    </button>
  );
}

/** Full-screen listening sheet + typed fallback when recognition is unavailable. */
export function VoiceSheet({
  open,
  listening,
  supported,
  interim,
  transcript,
  error,
  onClose,
  onRetry,
  onSubmitText,
}: {
  open: boolean;
  listening: boolean;
  supported: boolean;
  interim: string;
  transcript: string;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onSubmitText: (text: string) => void;
}) {
  const [typed, setTyped] = useState("");
  if (!open) return null;

  const blocked = !supported || error === "permission" || error === "unsupported";

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-rise mx-auto w-full max-w-[460px] rounded-t-3xl bg-card p-6 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-display text-lg font-bold">
              <Sparkles className="h-4 w-4 text-accent" /> Voice Assistant
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {blocked
                ? "Voice input isn't available here — you can type your command instead."
                : listening
                  ? "Listening… say a destination or a command"
                  : "Tap the microphone and speak"}
            </p>
          </div>
          <button onClick={onClose} className="press grid h-9 w-9 place-items-center rounded-xl bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid place-items-center">
          <button
            onClick={onRetry}
            disabled={blocked}
            className={`press relative grid h-24 w-24 place-items-center rounded-full transition-colors disabled:opacity-50 ${
              listening ? "bg-destructive text-destructive-foreground" : "brand-gradient text-white"
            }`}
          >
            {listening && (
              <span className="absolute inset-0 rounded-full bg-destructive/40 [animation:sp-pulse-ring_1.2s_ease-out_infinite]" />
            )}
            <span className="relative">
              {blocked ? (
                <MicOff className="h-9 w-9" />
              ) : listening ? (
                <ListeningIndicator />
              ) : (
                <Mic className="h-9 w-9" />
              )}
            </span>
          </button>
        </div>

        <p className="mt-4 min-h-[2.5rem] rounded-2xl bg-secondary px-4 py-3 text-center text-sm font-semibold">
          {interim || transcript || (listening ? "…" : "Ready when you are")}
        </p>

        {error === "permission" && (
          <p className="mt-3 rounded-2xl bg-warn/12 px-4 py-3 text-xs font-medium text-warn">
            Microphone permission was blocked. Allow mic access in your browser settings, or type your
            command below.
          </p>
        )}
        {(!supported || error === "unsupported") && (
          <p className="mt-3 rounded-2xl bg-warn/12 px-4 py-3 text-xs font-medium text-warn">
            Your browser doesn't support speech recognition yet. No problem — type your command instead.
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!typed.trim()) return;
            onSubmitText(typed.trim());
            setTyped("");
          }}
          className="mt-4 flex items-center gap-2 rounded-2xl border bg-background px-3 py-2"
        >
          <Keyboard className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type a command…"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="press rounded-xl bg-primary px-3 py-1.5 text-[0.7rem] font-bold text-primary-foreground"
          >
            Send
          </button>
        </form>

        <p className="mt-4 text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
          Try saying
        </p>
        <div className="no-scrollbar mt-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto">
          {VOICE_EXAMPLES.map((c) => (
            <button
              key={c}
              onClick={() => onSubmitText(c)}
              className="press rounded-full bg-secondary px-3 py-1.5 text-[0.68rem] font-semibold"
            >
              “{c}”
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Subtitle strip pinned above the bottom navigation. */
export function VoiceSubtitles({ text, speaking }: { text: string; speaking?: boolean }) {
  if (!text) return null;
  return (
    <div className="pointer-events-none fixed bottom-[248px] left-1/2 z-40 w-full max-w-[460px] -translate-x-1/2 px-4">
      <div className="animate-pop flex items-center gap-2 rounded-2xl bg-foreground/90 px-4 py-2.5 text-center text-xs font-semibold text-background shadow-float">
        {speaking ? (
          <Volume2 className="h-4 w-4 shrink-0" />
        ) : (
          <Mic className="h-4 w-4 shrink-0" />
        )}
        <span className="flex-1 text-left">{text}</span>
      </div>
    </div>
  );
}

/** Danger interrupt dialog offering a safer reroute. */
export function RerouteDialog({
  open,
  message,
  onYes,
  onNo,
}: {
  open: boolean;
  message: string;
  onYes: () => void;
  onNo: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 px-6 backdrop-blur-sm">
      <div className="animate-pop w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-float">
        <div className="relative mx-auto grid h-20 w-20 place-items-center">
          <span className="absolute inset-0 rounded-full bg-destructive/25 [animation:sp-pulse-ring_1.2s_ease-out_infinite]" />
          <span className="grid h-16 w-16 place-items-center rounded-full bg-destructive/15 text-3xl">
            ⚠️
          </span>
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-destructive">High-risk area ahead</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onNo}
            className="press flex-1 rounded-2xl bg-secondary py-3 text-sm font-bold"
          >
            No, continue
          </button>
          <button
            onClick={onYes}
            className="press flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
          >
            Yes, switch
          </button>
        </div>
      </div>
    </div>
  );
}
