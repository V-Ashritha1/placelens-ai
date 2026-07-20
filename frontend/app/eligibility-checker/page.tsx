// app/eligibility-checker/page.tsx (notification addition only; rest unchanged)
"use client";

import { toast } from "sonner";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ShieldX, Sparkles, Check, X, Loader2, FileText, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface EligibilityRequirementOut {
  label: string;
  met: boolean;
}

interface EligibilityOut {
  id: number;
  resume_id: number;
  role_title: string;
  company: string;
  experience_level: string;
  result: string;
  met_requirements: number;
  total_requirements: number;
  requirements: EligibilityRequirementOut[];
  created_at: string;
}

function formatUploadedAt(iso: string) {
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

function ResumePicker({
  resumes,
  loading,
  error,
  onSelect,
}: {
  resumes: ResumeOut[];
  loading: boolean;
  error: string | null;
  onSelect: (id: number) => void;
}) {
  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Eligibility Checker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a resume to check its eligibility for a role.
          </p>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading your resumes...</p>}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && resumes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No resumes uploaded yet. Upload a resume first to check its eligibility.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && resumes.length > 0 && (
          <div className="space-y-2">
            {resumes.map((resume) => (
              <Card
                key={resume.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onSelect(resume.id)}
              >
                <CardContent className="p-4 flex items-center gap-4" style={{ minHeight: "3.5rem" }}>
                  <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resume.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {formatUploadedAt(resume.uploaded_at)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(resume.id);
                    }}
                  >
                    Open Eligibility
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EligibilityCheckerPageContent() {
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [resumeNotFound, setResumeNotFound] = useState(false);

  const [pickerResumes, setPickerResumes] = useState<ResumeOut[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const [checks, setChecks] = useState<EligibilityOut[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [level, setLevel] = useState("senior");

  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const loadHistoryForResume = useCallback(async (id: number) => {
    const res = await api.get<EligibilityOut[]>(`/api/eligibility?resume_id=${id}&_=${Date.now()}`);
    return res.data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const requestedId = searchParams.get("resume_id");

      if (!requestedId) {
        setResumeId(null);
        setResumeNotFound(false);
        setChecks([]);
        setLoadingHistory(false);
        setPickerLoading(true);
        setPickerError(null);
        try {
          const res = await api.get<ResumeListOut>("/api/resume");
          if (!cancelled) setPickerResumes(res.data.resumes ?? []);
        } catch {
          if (!cancelled) setPickerError("Could not load your resumes. Please try again.");
        } finally {
          if (!cancelled) setPickerLoading(false);
        }
        return;
      }

      const parsedId = Number(requestedId);

      setLoadingHistory(true);
      setHistoryError(null);
      setResumeNotFound(false);
      // Clear the previous resume's history immediately so a slow fetch
      // never leaves stale results displayed under the new resume's name.
      setChecks([]);

      try {
        const resumeRes = await api.get<ResumeListOut>("/api/resume");
        if (cancelled) return;
        const resumes = resumeRes.data.resumes;
        const targetResume = Number.isNaN(parsedId)
          ? undefined
          : resumes.find((r) => r.id === parsedId);

        if (!targetResume) {
          if (!cancelled) {
            setResumeNotFound(true);
            setLoadingHistory(false);
          }
          return;
        }

        if (cancelled) return;
        setResumeId(targetResume.id);
        setFileName(targetResume.file_name);

        const history = await loadHistoryForResume(targetResume.id);
        if (!cancelled) setChecks(history);
      } catch {
        if (!cancelled) setHistoryError("Could not load eligibility history. Please try again.");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [searchParams, loadHistoryForResume]);

  function handleSelectResume(id: number) {
    router.push(`/eligibility-checker?resume_id=${id}`);
  }

  async function runCheck() {
    if (!role || !company || !resumeId) return;

    setRunning(true);
    setRunError(null);

    const toastId = toast.loading("Checking Eligibility...");

    try {
      const res = await api.post<EligibilityOut>("/api/eligibility/check", {
        role_title: role,
        company,
        experience_level: level,
        resume_id: resumeId,
      });

      const history = await loadHistoryForResume(resumeId);
      setChecks(history);
      setRole("");
      setCompany("");
      toast.success("Eligibility check completed", { id: toastId });
      addNotification({
        type: "eligibility",
        title: "Eligibility check completed",
        description: `${res.data.role_title} at ${res.data.company}: ${res.data.result === "eligible" ? "Eligible" : "Not eligible"}.`,
      });
      invalidateSearchCache();
    } catch (err) {
      setRunError("Eligibility check failed. Please try again.");
      toast.error(getApiErrorMessage(err) || "Eligibility check failed", { id: toastId });
    } finally {
      setRunning(false);
    }
  }

  const requestedId = searchParams.get("resume_id");

  if (!requestedId) {
    return (
      <ResumePicker
        resumes={pickerResumes}
        loading={pickerLoading}
        error={pickerError}
        onSelect={handleSelectResume}
      />
    );
  }

  if (resumeNotFound) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Resume not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Eligibility Checker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fileName
              ? `Checking eligibility for ${fileName}`
              : "Check whether your profile meets the requirements for a specific role."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Check a new role</CardTitle>
            <CardDescription>We&apos;ll compare your profile against typical requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role title</Label>
                <Input
                  id="role"
                  placeholder="e.g. Staff Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="e.g. Vercel"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Experience level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mid">Mid-level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="staff">Staff / Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {runError && <p className="text-sm text-destructive">{runError}</p>}

            <Button onClick={runCheck} disabled={running || !role || !company}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {running ? "Checking eligibility..." : "Check eligibility"}
            </Button>
          </CardContent>
        </Card>

        {loadingHistory && (
          <p className="text-sm text-muted-foreground">Loading eligibility history...</p>
        )}

        {historyError && (
          <p className="text-sm text-destructive">{historyError}</p>
        )}

        {!loadingHistory && !historyError && checks.length === 0 && (
          <p className="text-sm text-muted-foreground">No eligibility checks yet for this resume.</p>
        )}

        {!loadingHistory && (
          <div className="space-y-4">
            {checks.map((check) => (
              <Card key={check.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          check.result === "eligible" ? "bg-success/15" : "bg-destructive/15"
                        }`}
                      >
                        {check.result === "eligible" ? (
                          <ShieldCheck className="h-5 w-5 text-success" />
                        ) : (
                          <ShieldX className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{check.role_title}</p>
                        <p className="text-xs text-muted-foreground">{check.company}</p>
                      </div>
                    </div>
                    <Badge variant={check.result === "eligible" ? "success" : "destructive"}>
                      {check.result === "eligible" ? "Eligible" : "Not eligible"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    Meets {check.met_requirements} of {check.total_requirements} requirements
                  </p>

                  <div className="space-y-2">
                    {check.requirements.map((req, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm">
                        {req.met ? (
                          <Check className="h-4 w-4 text-success shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <span className={req.met ? "text-foreground" : "text-muted-foreground"}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function EligibilityCheckerPage() {
  return (
    <Suspense fallback={null}>
      <EligibilityCheckerPageContent />
    </Suspense>
  );
}