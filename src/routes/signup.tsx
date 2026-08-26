import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function friendlyError(message: string) {
    if (message.toLowerCase().includes("rate limit")) {
      return "Too many confirmation emails were requested. Please wait a few minutes before trying again.";
    }
    return message;
  }

  async function handleSignup(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setError(friendlyError(error.message));
        return;
      }

      if (data.user) {
        if (data.session) {
          navigate({ to: "/" });
        } else {
          setMessage("Account created. Check your email and confirm your account before logging in.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border bg-card p-8 shadow-lg">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">
              Create SafePath AI Account
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Create an account to use SafePath AI
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>

              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>

              <input
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>

              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Password must contain at least 6 characters.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm password</label>
              <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className="w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success */}
            {message && (
              <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-600">
                {message}
              </div>
            )}

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              Already have an account?{" "}
            </span>

            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
