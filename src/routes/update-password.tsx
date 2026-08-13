import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/update-password")({ component: UpdatePassword });

function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must contain at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError("This reset link is invalid or expired. Request a new password-reset email.");
    void navigate({ to: "/", replace: true });
  }

  return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-lg">
    <h1 className="text-center text-2xl font-bold">Choose a new password</h1>
    <p className="mt-2 text-center text-sm text-muted-foreground">Use at least 6 characters to secure your account.</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      <input required type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
      <input required type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">{loading ? "Updating..." : "Update password"}</button>
    </form>
    <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-primary hover:underline">Back to login</Link>
  </div></div>;
}
