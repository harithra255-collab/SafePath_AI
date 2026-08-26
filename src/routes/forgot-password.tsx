import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (lastSentAt && Date.now() - lastSentAt < 60_000) {
      setError("Please wait one minute before requesting another reset email.");
      return;
    }
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    if (error) {
      const normalized = error.message.toLowerCase();
      setError(normalized.includes("rate limit") ? "Too many email requests. Please wait a few minutes before trying again." : normalized.includes("failed to fetch") || normalized.includes("network") ? "Unable to reach SafePath authentication. Check your internet connection and try again." : error.message);
    } else {
      setLastSentAt(Date.now());
      setMessage("If an account exists for this email, a password-reset link has been sent.");
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lg">
    <h1 className="text-center text-2xl font-bold">Reset password</h1>
    <p className="mt-2 text-center text-sm text-muted-foreground">Enter your email and we’ll send a reset link.</p>
    <form onSubmit={submit} className="mt-7 space-y-4"><input required type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}{message && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      <button disabled={loading} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">{loading ? "Sending…" : "Send reset link"}</button>
    </form><Link to="/login" className="mt-5 block text-center text-sm font-semibold text-primary hover:underline">Back to login</Link>
  </div></div>;
}
