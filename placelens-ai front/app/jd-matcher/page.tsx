// app/jd-matcher/page.tsx (notification addition only; rest unchanged)
"use client";

import { toast } from "sonner";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Building2, MapPin, X, Check, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScoreRing } from "@/components/shared/score-ring";
import api, { getApiErrorMessage } from "@/lib/api";
import { addNotification } from "@/lib/notifications";
import { invalidateSearchCache } from "@/lib/search-cache";

interface ResumeOut {
  id: number;
  file_name: string;
  uploaded_at: string;
}

interface ResumeListOut {
  total: number;
  resumes: ResumeOut[];
}

interface JDMatchOut {
  id: number;
  role_title: string;
  company: string;
  location: string;
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  created_at: string;
}

function JdMatcherPageContent() {
  const [jdText, setJdText] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<JDMatchOut | null>(null);
  const [lastRun, setLastRun] = useState<JDMatchOut | null>(null);

  const [resumeId, setResumeId] = useState<number | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [noResume, setNoResume] = useState(false);

  const [matches, setMatches] = useState<JDMatchOut[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // Resume selection depends on the resume_id query param, so this effect
  // re-runs whenever the param changes. A `cancelled` flag guards against a
  // slower, stale request resolving after a newer one and overwriting state.
  useEffect(() => {
    let cancelled = false;

    async function loadResume() {
      try {
        const res = await api.get<ResumeListOut>("/api/resume");
        if (cancelled) return;
        const resumes = res.data.resumes;
        if (!resumes || resumes.length === 0) {
          setNoResume(true);
          return;
        }
        const requestedId = searchParams.get("resume_id");
        const parsedId = requestedId !== null ? Number(requestedId) : NaN;
        const target = requestedId && !Number.isNaN(parsedId)
          ? resumes.find((r) => r.id === parsedId)
          : [...resumes].sort(
              (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
            )[0];
        if (!target) {
          if (!cancelled) setNoResume(true);
          return;
        }
        if (cancelled) return;
        setResumeId(target.id);
        setResumeFileName(target.file_name);
      } catch {
        if (!cancelled) setNoResume(true);
      }
    }

    loadResume();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Match history (/api/jd) is not scoped by resume_id, so it only needs to
  // load once on mount rather than re-fetching on every param change.
  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setLoadingMatches(true);
      setMatchesError(null);
      try {
        const res = await api.get<JDMatchOut[]>("/api/jd");
        if (!cancelled) setMatches(res.data);
      } catch {
        if (!cancelled) setMatchesError("Could not load previous matches.");
      } finally {
        if (!cancelled) setLoadingMatches(false);
      }
    }

    loadMatches();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runMatch() {
    if (!resumeId) {
      setRunError("Upload a resume before running a match.");
      return;
    }
    if (!jdText.trim()) {
      setRunError("Paste a job description before running a match.");
      return;
    }

    setRunning(true);
    setRunError(null);

    const toastId = toast.loading("Analyzing Job Description...");

    try {
      const res = await api.post<JDMatchOut>("/api/jd/analyze", {
        resume_id: resumeId,
        role_title: roleTitle || "Untitled role",
        company: company || "Unknown company",
        location: location || "",
        jd_text: jdText,
      });
      setLastRun(res.data);
      setMatches((prev) => [res.data, ...prev]);
      toast.success("Job Description analysis completed", { id: toastId });
      addNotification({
        type: "jd_match",
        title: "Job Description analysis completed",
        description: `${res.data.match_score}% match for ${res.data.role_title} at ${res.data.company}.`,
      });
      invalidateSearchCache();
    } catch (err) {
      setRunError("Match analysis failed. Please try again.");
      toast.error(getApiErrorMessage(err) || "JD match failed", { id: toastId });
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">JD Matcher</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Paste any job description to see how well your resume matches — and what&apos;s missing.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Run a new match</CardTitle>
            <CardDescription>
              {noResume
                ? "Upload a resume first to run a match."
                : resumeFileName
                ? `Using resume: ${resumeFileName}`
                : "Loading resume…"}
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role title</Label>
                <Input
                  id="role"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g. Linear"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jd">Job description</Label>
              <Textarea
                id="jd"
                placeholder="Paste the full job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="min-h-[140px]"
              />
            </div>

            {runError && (
              <p className="text-sm text-destructive">{runError}</p>
            )}

            <Button onClick={runMatch} disabled={running || noResume}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {running ? "Analyzing match..." : "Run match analysis"}
            </Button>

            {lastRun && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center gap-4 animate-fade-in">
                <ScoreRing score={lastRun.match_score} size={72} strokeWidth={7} />
                <div>
                  <p className="text-sm font-medium">
                    {lastRun.role_title} at {lastRun.company}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Matched {lastRun.matched_keywords.length} of{" "}
                    {lastRun.matched_keywords.length + lastRun.missing_keywords.length} key terms
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="font-display text-base font-semibold mb-3">Previous matches</h2>
          {loadingMatches && (
            <p className="text-sm text-muted-foreground">Loading previous matches...</p>
          )}
          {matchesError && (
            <p className="text-sm text-destructive">{matchesError}</p>
          )}
          {!loadingMatches && !matchesError && matches.length === 0 && (
            <p className="text-sm text-muted-foreground">No previous matches yet.</p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {matches.map((match) => (
              <Card
                key={match.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setActiveMatch(match)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <ScoreRing score={match.match_score} size={64} strokeWidth={6} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{match.role_title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {match.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {match.location}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {match.matched_keywords.slice(0, 2).map((kw, i) => (
                        <Badge key={`matched-${i}-${kw}`} variant="success">
                          {kw}
                        </Badge>
                      ))}
                      {match.missing_keywords.slice(0, 2).map((kw, i) => (
                        <Badge key={`missing-${i}-${kw}`} variant="destructive">
                          {kw}
                        </Badge>
                      ))}
                      {match.matched_keywords.length + match.missing_keywords.length > 4 && (
                        <Badge variant="secondary">
                          +{match.matched_keywords.length + match.missing_keywords.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!activeMatch} onOpenChange={(open) => !open && setActiveMatch(null)}>
        <DialogContent>
          {activeMatch && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {activeMatch.role_title} · {activeMatch.company}
                </DialogTitle>
                <DialogDescription>{activeMatch.location}</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-4">
                <ScoreRing score={activeMatch.match_score} size={88} label="Match" />
                <p className="text-sm text-muted-foreground">
                  Your resume matches {activeMatch.match_score}% of the requirements detected in this job description.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Matched keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeMatch.matched_keywords.map((kw, i) => (
                    <Badge key={`matched-full-${i}-${kw}`} variant="success">
                      <Check className="h-3 w-3 mr-1" /> {kw}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Missing keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeMatch.missing_keywords.map((kw, i) => (
                    <Badge key={`missing-full-${i}-${kw}`} variant="destructive">
                      <X className="h-3 w-3 mr-1" /> {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

export default function JdMatcherPage() {
  return (
    <Suspense fallback={null}>
      <JdMatcherPageContent />
    </Suspense>
  );
}