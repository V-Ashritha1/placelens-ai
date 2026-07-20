// app/login/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Github, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { ScoreRing } from "@/components/shared/score-ring";
import { addNotification } from "@/lib/notifications";
import api, { getApiErrorMessage } from "@/lib/api";

interface LoginResponse {
  access_token: string;
  user: {
    full_name?: string;
    name?: string;
    email: string;
  };
}

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Login successful");
      addNotification({
        type: "login",
        title: "Login successful",
        description: `Welcome back, ${res.data.user?.full_name || res.data.user?.name || email}.`,
      });

      router.push("/dashboard");
    } catch (err) {
      toast.error(getApiErrorMessage(err) || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side */}
      <div className="hidden lg:flex relative flex-col justify-between p-10 border-r border-border overflow-hidden">
        <div className="absolute inset-0 grid-noise opacity-60" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative z-10">
          <Logo />
        </div>

        <div className="relative z-10 max-w-sm space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered career copilot
          </div>

          <h2 className="font-display text-3xl font-semibold leading-tight text-balance">
            Know your match score before you hit apply.
          </h2>

          <p className="text-sm text-muted-foreground">
            PlaceLens scans your resume against real job descriptions,
            scores it against ATS systems, and shows exactly what to fix.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 card-elevated p-4 w-fit">
          <ScoreRing score={88} size={64} strokeWidth={6} />

          <div>
            <p className="text-sm font-medium">
              Senior Frontend Engineer
            </p>
            <p className="text-xs text-muted-foreground">
              Match score at Stripe
            </p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center">
            <Logo />
          </div>

          <div className="space-y-1.5 text-center lg:text-left">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>

            <p className="text-sm text-muted-foreground">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>

                <span
                  className="text-xs text-muted-foreground cursor-not-allowed select-none"
                  title="Coming soon"
                >
                  Forgot password?{" "}
                  <span className="text-[10px] uppercase tracking-wide">(Coming soon)</span>
                </span>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}

              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              or continue with
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full relative" type="button" disabled title="Coming soon">
              <Github className="h-4 w-4" />
              GitHub
              <span className="absolute -top-2 -right-2 rounded-full bg-secondary border border-border px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                Soon
              </span>
            </Button>

            <Button variant="outline" className="w-full relative" type="button" disabled title="Coming soon">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 11v2.8h6.5c-.3 1.6-2.1 4.7-6.5 4.7-3.9 0-7.1-3.2-7.1-7.2S8.1 4.1 12 4.1c2.2 0 3.7.9 4.6 1.7l3.1-3C17.8 1 15.2 0 12 0 5.4 0 0 5.4 0 12s5.4 12 12 12c6.9 0 11.5-4.9 11.5-11.7 0-.8-.1-1.4-.2-2.1H12z" />
              </svg>
              Google
              <span className="absolute -top-2 -right-2 rounded-full bg-secondary border border-border px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                Soon
              </span>
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}