import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");

  function friendlyLoginError(message: string) {
    const normalized = message.toLowerCase();
    if (normalized.includes("email not confirmed")) return "Your email is not confirmed. Check your inbox or resend the confirmation email below.";
    if (normalized.includes("invalid login credentials")) return "Email or password is incorrect. Use the same email you registered with, or reset your password.";
    if (normalized.includes("rate limit")) return "Too many attempts. Wait a few minutes and try again.";
    if (normalized.includes("failed to fetch") || normalized.includes("network")) return "Unable to reach SafePath authentication. Check your internet connection and try again.";
    return message;
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setLoading(false);
    if (error) {
      setConfirmationEmail(normalizedEmail);
      return setError(friendlyLoginError(error.message));
    }
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lg">
        <h1 className="text-center text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Log in to plan safer journeys.</p>
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">Email<input required type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>
          <label className="block text-sm font-medium">Password<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>
          <Link to="/forgot-password" className="block text-right text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
          {error && <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600"><p>{error}</p>{error.includes("not confirmed") && confirmationEmail && <button type="button" onClick={async () => { const { error: resendError } = await supabase.auth.resend({ type: "signup", email: confirmationEmail }); setError(resendError ? friendlyLoginError(resendError.message) : "Confirmation email sent. Check your inbox and spam folder."); }} className="font-semibold underline">Resend confirmation email</button>}</div>}
          <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{loading ? "Logging in…" : "Log in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">New to SafePath? <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link></p>
      </div>
    </div>
  );
}
