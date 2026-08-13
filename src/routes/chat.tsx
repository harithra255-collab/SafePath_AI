import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Send, Sparkle } from "lucide-react";
import { Shell } from "@/components/safepath/Shell";
import { useApp } from "@/lib/app-state";
import { useTrip } from "@/lib/trip-state";
import { chatAnswer } from "@/data/safepath";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Safety Assistant — SafePath AI" },
      {
        name: "description",
        content:
          "Ask the SafePath AI assistant about night safety, safest routes, nearby hospitals and recent incidents.",
      },
      { property: "og:title", content: "AI Safety Assistant — SafePath AI" },
      {
        property: "og:description",
        content: "Conversational travel-safety reasoning powered by SafePath's safety graph.",
      },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: string; role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Is this area safe after 10 PM?",
  "Which route is safest?",
  "Any recent incidents nearby?",
  "Where is the nearest hospital?",
];

function ChatPage() {
  const { t } = useApp();
  const { dest } = useTrip();
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "0",
      role: "ai",
      text: `Hi! I'm your SafePath safety assistant. ${dest ? `I've loaded live data for **${dest.name}**.` : "Search a destination on Home and I'll analyse it for you."} Ask me anything about your journey.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  function send(text: string) {
    if (!text.trim()) return;
    const q: Msg = { id: `u-${Date.now()}`, role: "user", text };
    setMsgs((m) => [...m, q]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "ai", text: chatAnswer(text, dest) },
      ]);
      setTyping(false);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 900);
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="brand-gradient grid h-9 w-9 place-items-center rounded-2xl">
            <Sparkle className="h-4.5 w-4.5 text-white" />
          </span>
          <div>
            <h1 className="font-display text-base font-bold">{t.chatTitle}</h1>
            <p className="text-[0.68rem] text-muted-foreground">
              {dest ? `Context: ${dest.name}` : "No destination selected"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`animate-rise flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-3xl rounded-br-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground"
                    : "text-foreground"
                }`}
                dangerouslySetInnerHTML={{
                  __html: m.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            </div>
          ))}
          {typing && (
            <p className="shimmer inline-block rounded-xl px-2 py-1 text-sm font-medium text-muted-foreground">
              SafePath AI is reasoning…
            </p>
          )}
          <div ref={endRef} />
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="press shrink-0 rounded-full bg-secondary px-3 py-1.5 text-[0.7rem] font-semibold"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="glass sticky bottom-32 flex items-center gap-2 rounded-2xl px-3 py-2 shadow-soft"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.askPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="press grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </Shell>
  );
}
