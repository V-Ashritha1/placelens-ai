// app/ats-report/page.tsx (notification additions only; rest unchanged)
"use client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, AlertTriangle, AlertCircle, Info, CheckCircle2, Loader2, ScanSearch } from "lucide-react";
import { jsPDF } from "jspdf";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/shared/score-ring";
import api, { getApiErrorMessage } from "@/lib/api";
import { getScoreVariant } from "@/lib/score-color";
import { addNotification } from "@/lib/notifications";
import { invalidateSearchCache } from "@/lib/search-cache";

const severityConfig = {
  high: { icon: AlertTriangle, variant: "destructive" as const, label: "High priority" },
  medium: { icon: AlertCircle, variant: "warning" as const, label: "Medium priority" },
  low: { icon: Info, variant: "secondary" as const, label: "Low priority" },
};

interface ResumeOut {
  id: number;
  file_name: string;
  file_size_kb: number;
  content_type: string;
  status: string;
  uploaded_at: string;
}

interface ResumeListOut {
  total: number;
  resumes: ResumeOut[];
}

interface AtsIssue {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

interface AtsStrength {
  title: string;
  detail: string;
}

interface AtsSections {
  formatting: number;
  keyword: number;
  structure: number;
  metadata: number;
  impact: number;
}

interface AtsReportOut {
  id: number;
  resume_id: number;
  overall_score: number;
  sections: AtsSections;
  issues: AtsIssue[];
  strengths: AtsStrength[];
  scanned_at: string;
  skill_gaps?: string[];
}

interface SectionRow {
  label: string;
  score: number;
}

function toSectionRows(sections: AtsSections): SectionRow[] {
  return [
    { label: "Formatting & Parseability", score: sections.formatting },
    { label: "Keyword Match", score: sections.keyword },
    { label: "Section Structure", score: sections.structure },
    { label: "Contact & Metadata", score: sections.metadata },
    { label: "Action Verbs & Impact", score: sections.impact },
  ];
}

function formatScannedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AtsReportPageContent() {
  const [atsReport, setAtsReport] = useState<AtsReportOut | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [noResume, setNoResume] = useState(false);
  const [noReport, setNoReport] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeSuccess, setAnalyzeSuccess] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setNoResume(false);
      setNoReport(false);

      try {
        const resumeRes = await api.get<ResumeListOut>("/api/resume");
        if (cancelled) return;
        const resumes = resumeRes.data.resumes;

        if (!resumes || resumes.length === 0) {
          setNoResume(true);
          setLoading(false);
          return;
        }

        const requestedId = searchParams.get("resume_id");
        const parsedId = requestedId !== null ? Number(requestedId) : NaN;
        const targetResume = requestedId && !Number.isNaN(parsedId)
          ? resumes.find((r) => r.id === parsedId)
          : [...resumes].sort(
              (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
            )[0];

        if (!targetResume) {
          if (!cancelled) {
            setNoResume(true);
            setLoading(false);
          }
          return;
        }

        if (cancelled) return;
        setFileName(targetResume.file_name);
        setResumeId(targetResume.id);

        try {
          const reportRes = await api.get<AtsReportOut>(`/api/ats/${targetResume.id}`);
          if (!cancelled) setAtsReport(reportRes.data);
        } catch {
          if (!cancelled) setNoReport(true);
        }
      } catch {
        if (!cancelled) setNoResume(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReport();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  async function handleAnalyzeNow() {
    if (!resumeId) return;

    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeSuccess(null);

    const toastId = toast.loading("Generating ATS report...");

    try {
      await api.post("/api/ats/analyze", {
        resume_id: resumeId,
      });

      const refreshed = await api.get<AtsReportOut>(
        `/api/ats/${resumeId}?_=${Date.now()}`
      );

      setAtsReport(refreshed.data);
      setNoReport(false);
      setAnalyzeSuccess("ATS report re-analyzed successfully.");
      setTimeout(() => setAnalyzeSuccess(null), 4000);
      toast.success("ATS report generated successfully", { id: toastId });
      addNotification({
        type: "ats_report",
        title: "ATS report generated",
        description: `${fileName || "Resume"} scored ${refreshed.data.overall_score}% on ATS compatibility.`,
      });
      invalidateSearchCache();

    } catch (err) {
      setAnalyzeError("Analysis failed. Please try again.");
      toast.error(getApiErrorMessage(err) || "Failed to generate ATS report", { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  }

  function handleExportPDF() {
    if (!atsReport) return;

    setExportError(null);
    setExporting(true);

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 48;
      let y = 56;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - 48) {
          doc.addPage();
          y = 56;
        }
      };

      const addHeading = (text: string) => {
        ensureSpace(28);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(20, 20, 20);
        doc.text(text, marginX, y);
        y += 20;
      };

      const addBody = (text: string, opts: { bold?: boolean; color?: [number, number, number]; size?: number } = {}) => {
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        doc.setFontSize(opts.size ?? 10.5);
        const [r, g, b] = opts.color ?? [60, 60, 60];
        doc.setTextColor(r, g, b);
        const lines = doc.splitTextToSize(text, pageWidth - marginX * 2);
        for (const line of lines) {
          ensureSpace(16);
          doc.text(line, marginX, y);
          y += 15;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(20, 20, 20);
      doc.text("ATS Report", marginX, y);
      y += 26;

      addBody(`Resume: ${fileName || "Untitled resume"}`, { bold: true, color: [30, 30, 30] });
      addBody(`Scanned on: ${formatScannedAt(atsReport.scanned_at)}`);
      y += 8;

      addHeading(`Overall ATS Score: ${atsReport.overall_score}%`);
      y += 4;

      addHeading("Section Breakdown");
      for (const section of toSectionRows(atsReport.sections)) {
        addBody(`${section.label}: ${section.score}%`);
      }
      y += 8;

      addHeading(`Issues (${atsReport.issues.length})`);
      if (atsReport.issues.length === 0) {
        addBody("No issues found.");
      } else {
        for (const issue of atsReport.issues) {
          addBody(`• [${severityConfig[issue.severity].label}] ${issue.title}`, { bold: true, color: [20, 20, 20] });
          addBody(issue.detail);
          y += 2;
        }
      }
      y += 8;

      addHeading(`Strengths (${atsReport.strengths.length})`);
      if (atsReport.strengths.length === 0) {
        addBody("No strengths recorded.");
      } else {
        for (const strength of atsReport.strengths) {
          addBody(`• ${strength.title}`, { bold: true, color: [20, 20, 20] });
          addBody(strength.detail);
          y += 2;
        }
      }

      if (atsReport.skill_gaps && atsReport.skill_gaps.length > 0) {
        y += 8;
        addHeading(`Skill Gaps (${atsReport.skill_gaps.length})`);
        for (const gap of atsReport.skill_gaps) {
          addBody(`• ${gap}`);
        }
      }

      const safeName = (fileName || "resume").replace(/\.[^/.]+$/, "").replace(/[^a-z0-9\-_]+/gi, "_");
      doc.save(`ATS_Report_${safeName}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err) {
      setExportError("Could not generate PDF. Please try again.");
      toast.error("Could not export PDF");
    } finally {
      setExporting(false);
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

  if (noReport || !atsReport) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ScanSearch className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">No ATS report yet for {fileName || "this resume"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Run analysis to get your ATS score, section breakdown, issues, and strengths.
            </p>
          </div>
          {analyzeError && (
            <p className="text-sm text-destructive">{analyzeError}</p>
          )}
          <Button onClick={handleAnalyzeNow} disabled={analyzing || !resumeId}>
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              "Analyze Now"
            )}
          </Button>
        </div>
      </AppShell>
    );
  }

  const sectionRows = toSectionRows(atsReport.sections);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">ATS Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {fileName} · Scanned on {formatScannedAt(atsReport.scanned_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleAnalyzeNow} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Re-analyzing…
                </>
              ) : (
                "Re-analyze"
              )}
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {analyzeError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {analyzeError}
          </div>
        )}

        {analyzeSuccess && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-500">
            {analyzeSuccess}
          </div>
        )}

        {exportError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {exportError}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center justify-center p-6">
            <ScoreRing score={atsReport.overall_score} size={140} strokeWidth={10} label="ATS Score" />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Better than 71% of resumes in your target role
            </p>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Section breakdown</CardTitle>
              <CardDescription>How each area of your resume scored</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sectionRows.map((section) => {
                const variant = getScoreVariant(section.score);
                return (
                  <div key={section.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{section.label}</span>
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          variant === "success" && "text-success",
                          variant === "warning" && "text-warning",
                          variant === "destructive" && "text-destructive"
                        )}
                      >
                        {section.score}%
                      </span>
                    </div>
                    <Progress
                      value={section.score}
                      className={cn(
                        "[&>div]:transition-colors",
                        variant === "success" && "[&>div]:bg-success",
                        variant === "warning" && "[&>div]:bg-warning",
                        variant === "destructive" && "[&>div]:bg-destructive"
                      )}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="issues">
          <TabsList>
            <TabsTrigger value="issues">Issues ({atsReport.issues.length})</TabsTrigger>
            <TabsTrigger value="strengths">Strengths ({atsReport.strengths.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="issues">
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {atsReport.issues.map((issue, i) => {
                  const config = severityConfig[issue.severity];
                  const Icon = config.icon;
                  return (
                    <div key={i} className="flex items-start gap-4 p-5">
                      <Icon className="h-[18px] w-[18px] mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{issue.title}</p>
                          <Badge variant={config.variant}>{config.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{issue.detail}</p>
                      </div>
                    </div>
                  );
                })}
                {atsReport.issues.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No issues found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strengths">
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {atsReport.strengths.map((strength, i) => (
                  <div key={i} className="flex items-start gap-4 p-5">
                    <CheckCircle2 className="h-[18px] w-[18px] mt-0.5 shrink-0 text-success" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{strength.title}</p>
                      <p className="text-sm text-muted-foreground">{strength.detail}</p>
                    </div>
                  </div>
                ))}
                {atsReport.strengths.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No strengths recorded.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

export default function AtsReportPage() {
  return (
    <Suspense fallback={null}>
      <AtsReportPageContent />
    </Suspense>
  );
}