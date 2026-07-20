// app/skill-gap/page.tsx
"use client";

import { BarChart3, Sparkles, Clock, TrendingUp, Rocket } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScoreRing } from "@/components/shared/score-ring";
import { cn } from "@/lib/utils";
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

interface SkillGapSkillOut {
  category: string;
  name: string;
  level: number;
  required: number;
}

interface RecommendationOut {
  title: string;
  why_it_matters: string;
  explanation: string;
  recommended_project: string;
  difficulty: string;
  learning_time: string;
  ats_impact: string;
}

interface SkillGapOut {
  id: number;
  resume_id: number;
  target_role: string;
  overall_readiness: number;
  skills: SkillGapSkillOut[];
  recommendations: RecommendationOut[];
  created_at: string;
}

interface GroupedCategory {
  name: string;
  skills: SkillGapSkillOut[];
}

function groupByCategory(skills: SkillGapSkillOut[]): GroupedCategory[] {
  const map = new Map<string, SkillGapSkillOut[]>();
  for (const skill of skills) {
    const existing = map.get(skill.category);
    if (existing) {
      existing.push(skill);
    } else {
      map.set(skill.category, [skill]);
    }
  }
  return Array.from(map.entries()).map(([name, skills]) => ({ name, skills }));
}

function getLatest(reports: SkillGapOut[]): SkillGapOut | null {
  if (!reports || reports.length === 0) return null;
  return [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

function SkillBar({ name, level, required }: { name: string; level: number; required: number }) {
  const gapMet = level >= required;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{name}</span>
        <span className={cn("text-xs tabular-nums", gapMet ? "text-success" : "text-warning")}>
          {level}% <span className="text-muted-foreground">/ {required}% required</span>
        </span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", gapMet ? "bg-success" : "bg-primary")}
          style={{ width: `${level}%` }}
        />
        <div className="absolute top-0 h-full w-px bg-foreground/40" style={{ left: `${required}%` }} />
      </div>
    </div>
  );
}

const difficultyVariant: Record<string, "default" | "success" | "warning" | "secondary" | "destructive"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "destructive",
};

function RecommendationCard({ rec }: { rec: RecommendationOut }) {
  return (
    <Card className="hover:border-primary/50 hover:-translate-y-0.5 transition-all">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold leading-snug">{rec.title}</p>
          <Badge variant="success" className="shrink-0 gap-1">
            <TrendingUp className="h-3 w-3" />
            {rec.ats_impact}
          </Badge>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Why this matters</p>
            <p className="text-sm mt-0.5">{rec.why_it_matters}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Personalized advice</p>
            <p className="text-sm mt-0.5 text-muted-foreground">{rec.explanation}</p>
          </div>
          <div className="rounded-md bg-secondary/50 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Recommended project
            </p>
            <p className="text-sm">{rec.recommended_project}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          <Badge variant={difficultyVariant[rec.difficulty] || "secondary"}>{rec.difficulty}</Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {rec.learning_time}
          </Badge>
        </div>

        <Button variant="outline" size="sm" className="w-full">
          <Rocket className="h-3.5 w-3.5" />
          Start Learning
        </Button>
      </CardContent>
    </Card>
  );
}

function SkillGapPageContent() {
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [noResume, setNoResume] = useState(false);

  const [report, setReport] = useState<SkillGapOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [noReport, setNoReport] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState("");

  const searchParams = useSearchParams();

  const loadLatestReportForResume = useCallback(async (id: number) => {
    const res = await api.get<SkillGapOut[]>(`/api/skill-gap?resume_id=${id}&_=${Date.now()}`);
    return getLatest(res.data);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNoResume(false);
      setNoReport(false);
      setLoadError(null);

      try {
        const resumeRes = await api.get<ResumeListOut>("/api/resume");
        const resumes = resumeRes.data.resumes;

        if (!resumes || resumes.length === 0) {
          setNoResume(true);
          setLoading(false);
          return;
        }

        const requestedId = searchParams.get("resume_id");
        const targetResume = requestedId
          ? resumes.find((r) => r.id === Number(requestedId))
          : [...resumes].sort(
              (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
            )[0];

        if (!targetResume) {
          setNoResume(true);
          setLoading(false);
          return;
        }

        setResumeId(targetResume.id);
        setFileName(targetResume.file_name);

        try {
          const latest = await loadLatestReportForResume(targetResume.id);
          if (latest) {
            setReport(latest);
          } else {
            setNoReport(true);
          }
        } catch {
          setLoadError("Could not load skill gap analysis. Please try again.");
        }
      } catch {
        setNoResume(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [searchParams, loadLatestReportForResume]);

  function openRoleDialog() {
    setTargetRoleInput(report?.target_role ?? "");
    setRoleDialogOpen(true);
  }

  async function submitTargetRole() {
    if (!resumeId || !targetRoleInput.trim()) return;

    const targetRole = targetRoleInput.trim();
    setRoleDialogOpen(false);
    setAnalyzing(true);
    setAnalyzeError(null);

    const toastId = toast.loading("Generating Skill Gap...");

    try {
      const res = await api.post<SkillGapOut>("/api/skill-gap/analyze", {
        resume_id: resumeId,
        target_role: targetRole,
      });

      const latest = await loadLatestReportForResume(resumeId);
      if (latest) {
        setReport(latest);
        setNoReport(false);
      }
      toast.success("Skill Gap analysis completed", { id: toastId });
      addNotification({
        type: "skill_gap",
        title: "Skill Gap analysis completed",
        description: `Readiness for ${res.data.target_role}: ${res.data.overall_readiness}%.`,
      });
      invalidateSearchCache();
    } catch (err) {
      setAnalyzeError("Skill gap analysis failed. Please try again.");
      toast.error(getApiErrorMessage(err) || "Skill gap analysis failed", { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AppShell>
    );
  }

  if (noResume) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">No resume uploaded.</p>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <p className="text-sm text-destructive">{loadError}</p>
      </AppShell>
    );
  }

  if (noReport || !report) {
    return (
      <AppShell>
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Skill Gap Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {fileName ? `Benchmark ${fileName} against typical role requirements.` : "Benchmark this resume against typical role requirements."}
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">No skill gap analysis yet for {fileName || "this resume"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Run analysis to benchmark this resume against typical requirements.
                </p>
              </div>
              {analyzeError && <p className="text-sm text-destructive">{analyzeError}</p>}
              <Button onClick={openRoleDialog} disabled={analyzing || !resumeId}>
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  "Analyze Now"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Dialog open={roleDialogOpen} onOpenChange={(open) => !open && setRoleDialogOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter target role</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="target-role">Target role</Label>
              <Input
                id="target-role"
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && submitTargetRole()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitTargetRole} disabled={!targetRoleInput.trim()}>
                Analyze
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
    );
  }

  const categories = groupByCategory(report.skills);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Skill Gap Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {fileName} · Benchmarked against typical requirements for {report.target_role}
            </p>
          </div>
          <Button variant="outline" onClick={openRoleDialog} disabled={analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Re-analyzing…
              </>
            ) : (
              "Re-analyze"
            )}
          </Button>
        </div>

        {analyzeError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {analyzeError}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center justify-center p-6">
            <ScoreRing score={report.overall_readiness} size={140} strokeWidth={10} label="Readiness" />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              You&apos;re ready for most {report.target_role} roles, with a few key gaps to close
            </p>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI-personalized recommendations
              </CardTitle>
              <CardDescription>
                Based on your resume, projects, and target role — prioritized by ATS impact
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className="text-sm">{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {category.skills.map((skill) => (
                  <SkillBar key={skill.name} {...skill} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={roleDialogOpen} onOpenChange={(open) => !open && setRoleDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter target role</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="target-role">Target role</Label>
            <Input
              id="target-role"
              value={targetRoleInput}
              onChange={(e) => setTargetRoleInput(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && submitTargetRole()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitTargetRole} disabled={!targetRoleInput.trim()}>
              Analyze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

export default function SkillGapPage() {
  return (
    <Suspense fallback={null}>
      <SkillGapPageContent />
    </Suspense>
  );
}