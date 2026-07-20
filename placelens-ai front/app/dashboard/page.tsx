"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  UploadCloud,
  FileSearch,
  Target,
  BarChart3,
  ArrowUpRight,
  FileStack,
  Trophy,
  Sparkles,
  Clock,
  Upload,
  ScanSearch,
  ShieldCheck,
  Inbox,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/shared/score-ring";
import { AtsTrendChart } from "@/components/dashboard/ats-trend-chart";

import api from "@/lib/api";

interface LastAnalyzedResumeOut {
  resume_id: number;
  file_name: string;
  analyzed_at: string;
}

interface BestResumeOut {
  resume_id: number;
  file_name: string;
  best_ats_score: number;
  last_analyzed_at: string;
}

interface AtsTrendPointOut {
  resume_id: number;
  file_name: string;
  score: number;
  scanned_at: string;
}

interface ActivityOut {
  type: string;
  resume_id: number | null;
  resume_name: string;
  description: string;
  timestamp: string;
}

interface DashboardOut {
  best_ats_score: number | null;
  best_jd_match_score: number | null;
  best_jd_match_role: string | null;
  total_resumes: number;
  total_analyses: number;
  last_analyzed_resume: LastAnalyzedResumeOut | null;
  best_resume: BestResumeOut | null;
  ats_trend: AtsTrendPointOut[];
  recent_activities: ActivityOut[];
}

const quickActions = [
  {
    href: "/resume-upload",
    label: "Upload resume",
    icon: UploadCloud,
    desc: "Add a new resume for analysis",
  },
  {
    href: "/jd-matcher",
    label: "Match a job",
    icon: Target,
    desc: "Paste a JD to see your match score",
  },
  {
    href: "/ats-report",
    label: "Analyze resume",
    icon: FileSearch,
    desc: "Run or view your ATS scan",
  },
  {
    href: "/resume-upload",
    label: "Resume library",
    icon: FileStack,
    desc: "View and manage your resumes",
  },
];

const activityIcons: Record<string, any> = {
  upload: Upload,
  ats_analyzed: ScanSearch,
  jd_matched: Target,
  resume_reanalyzed: ScanSearch,
  skill_gap: BarChart3,
  eligibility: ShieldCheck,
};

const activityBadge: Record<string, "default" | "success" | "warning" | "secondary"> = {
  upload: "secondary",
  ats_analyzed: "default",
  jd_matched: "success",
  resume_reanalyzed: "default",
  skill_gap: "warning",
  eligibility: "secondary",
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="h-8 w-8 rounded-md bg-secondary animate-pulse" />
        <div className="h-6 w-16 rounded bg-secondary animate-pulse" />
        <div className="h-3 w-24 rounded bg-secondary animate-pulse" />
      </CardContent>
    </Card>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  description,
  isEmpty,
}: {
  icon: any;
  label: string;
  value: string;
  description: string;
  isEmpty?: boolean;
}) {
  return (
    <Card className="hover:border-primary/50 hover:-translate-y-0.5 transition-all">
      <CardContent className="p-5 space-y-3">
        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-[18px] w-[18px] text-primary" />
        </div>
        <div>
          <p className={`text-xl font-semibold font-display tracking-tight ${isEmpty ? "text-muted-foreground" : ""}`}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [dashboard, setDashboard] = useState<DashboardOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<DashboardOut>("/api/dashboard");
        setDashboard(res.data);
      } catch (err) {
        setError("Could not load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const isEmptyState = !loading && dashboard && dashboard.total_resumes === 0;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Welcome back, {user?.full_name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here&apos;s how your job search is trending this week.
            </p>
          </div>
          <Button asChild>
            <Link href="/resume-upload">
              <UploadCloud className="h-4 w-4" />
              Upload new resume
            </Link>
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isEmptyState ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Inbox className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-base font-medium">No resumes yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Upload your first resume to unlock ATS scoring, JD matching, skill gap analysis, and your personal
                  dashboard.
                </p>
              </div>
              <Button asChild>
                <Link href="/resume-upload">
                  <UploadCloud className="h-4 w-4" />
                  Upload your first resume
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {loading || !dashboard ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <KpiCard
                    icon={Trophy}
                    label="Best ATS Score"
                    value={dashboard.best_ats_score ? `${dashboard.best_ats_score}%` : "—"}
                    description="Highest scan across all resumes"
                    isEmpty={!dashboard.best_ats_score}
                  />
                  <KpiCard
                    icon={Sparkles}
                    label="Best JD Match"
                    value={dashboard.best_jd_match_score ? `${dashboard.best_jd_match_score}%` : "—"}
                    description={dashboard.best_jd_match_role || "No matches run yet"}
                    isEmpty={!dashboard.best_jd_match_score}
                  />
                  <KpiCard
                    icon={FileStack}
                    label="Total Resumes"
                    value={String(dashboard.total_resumes)}
                    description="Uploaded to your library"
                    isEmpty={dashboard.total_resumes === 0}
                  />
                  <KpiCard
                    icon={BarChart3}
                    label="Total Analyses"
                    value={String(dashboard.total_analyses)}
                    description="ATS scans + JD matches run"
                    isEmpty={dashboard.total_analyses === 0}
                  />
                </>
              )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>ATS score trend</CardTitle>
                  <CardDescription>How your ATS scores have changed over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading || !dashboard ? (
                    <div className="h-[220px] w-full rounded-md bg-secondary animate-pulse" />
                  ) : (
                    <AtsTrendChart data={dashboard.ats_trend} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Best performing resume</CardTitle>
                  <CardDescription>Your top ATS scorer</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  {loading || !dashboard ? (
                    <div className="h-28 w-28 rounded-full bg-secondary animate-pulse" />
                  ) : dashboard.best_resume ? (
                    <>
                      <ScoreRing score={dashboard.best_resume.best_ats_score} size={112} label="ATS" />
                      <div className="text-center">
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {dashboard.best_resume.file_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Analyzed {formatTimestamp(dashboard.best_resume.last_analyzed_at)}
                        </p>
                      </div>
                      <Button variant="outline" asChild className="w-full">
                        <Link href={`/ats-report?resume_id=${dashboard.best_resume.resume_id}`}>
                          View full report
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No ATS analysis yet. Run a scan to see your best performer here.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Your latest uploads, scans, and matches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {loading || !dashboard ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 w-full rounded-md bg-secondary animate-pulse" />
                    ))}
                  </div>
                ) : dashboard.recent_activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  dashboard.recent_activities.map((item, i) => {
                    const Icon = activityIcons[item.type] || Clock;
                    return (
                      <div
                        key={`${item.type}-${item.resume_id}-${i}`}
                        className="flex items-start gap-3 rounded-md px-2 py-3 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-[15px] w-[15px] text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{item.resume_name}</p>
                            <Badge variant={activityBadge[item.type] || "secondary"} className="capitalize shrink-0">
                              {item.type.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div>
              <h2 className="font-display text-base font-semibold mb-3">Quick actions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <Card className="h-full hover:border-primary/50 hover:-translate-y-0.5 transition-all cursor-pointer">
                      <CardContent className="p-5 space-y-3">
                        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                          <action.icon className="h-[18px] w-[18px] text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{action.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}