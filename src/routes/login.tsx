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

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      return setError(error.message === "Email not confirmed" ? "Confirm your email from the Supabase message first, then log in." : error.message);
    }
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lg">
        <h1 className="text-center text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Log in to plan safer journeys.</p>
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>
          <label className="block text-sm font-medium">Password<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>
          <Link to="/forgot-password" className="block text-right text-xs font-semibold text-primary hover:underline">Forgot password?</Link>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50">{loading ? "Logging in…" : "Log in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">New to SafePath? <Link to="/signup" className="font-semibold text-primary hover:underline">Create an account</Link></p>
      </div>
    </div>
  );
}
