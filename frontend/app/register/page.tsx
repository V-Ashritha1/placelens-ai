// app/register/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import api, { getApiErrorMessage } from "@/lib/api";

const perks = [
  "Instant ATS compatibility scoring",
  "Job description match analysis",
  "Personalized skill gap roadmap",
];

interface RegisterResponse {
  access_token: string;
  user: {
    full_name?: string;
    name?: string;
    email: string;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post<RegisterResponse>("/api/auth/register", {
        full_name: `${firstName} ${lastName}`.trim(),
        email,
        password,
      });

      if (res.data?.access_token) {
        localStorage.setItem("token", res.data.access_token);
      }
      if (res.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      toast.success("Registration successful");
      router.push("/dashboard");
    } catch (err) {
      toast.error(getApiErrorMessage(err) || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex relative flex-col justify-between p-10 border-r border-border overflow-hidden">
        <div className="absolute inset-0 grid-noise opacity-60" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative z-10">
          <Logo />
        </div>
        <div className="relative z-10 max-w-sm space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Free to start
          </div>
          <h2 className="font-display text-3xl font-semibold leading-tight text-balance">
            Build a resume that clears every ATS filter.
          </h2>
          <p className="text-sm text-muted-foreground">
            Join thousands of candidates using PlaceLens  to understand exactly why they aren&apos;t getting callbacks.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {perks.map((perk) => (
            <div key={perk} className="flex items-center gap-2.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span className="text-muted-foreground">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center">
            <Logo />
          </div>

          <div className="space-y-1.5 text-center lg:text-left">
            <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start optimizing your job search in minutes.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="Ananya"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Rao"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to PlaceLens &apos;s Terms of Service and Privacy Policy.
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}