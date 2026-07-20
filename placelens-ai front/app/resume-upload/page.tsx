// app/resume-upload/page.tsx
"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  MoreVertical,
  Trash2,
  Eye,
  Download,
  Pencil,
  Star,
  Target,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api, { getApiErrorMessage } from "@/lib/api";
import { addNotification } from "@/lib/notifications";
import { invalidateSearchCache } from "@/lib/search-cache";

type UploadState = "idle" | "uploading" | "done";

interface ResumeOut {
  id: number;
  file_name: string;
  display_name: string | null;
  file_size_kb: number;
  content_type: string;
  status: string;
  is_default: boolean;
  uploaded_at: string;
}

interface ResumeListOut {
  total: number;
  resumes: ResumeOut[];
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const WARN_FILE_SIZE_BYTES = 4 * 1024 * 1024;

function isAcceptedFile(file: File) {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatSize(kb: number) {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
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

function displayNameOf(file: ResumeOut) {
  return file.display_name && file.display_name.trim().length > 0 ? file.display_name : file.file_name;
}

async function triggerAtsAnalysis(resumeId: number) {
  try {
    await api.post("/api/ats/analyze", { resume_id: resumeId });
    invalidateSearchCache();
  } catch (err) {
    console.warn(`Automatic ATS analysis failed for resume ${resumeId}:`, err);
  }
}

export default function ResumeUploadPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [uploadingName, setUploadingName] = useState<string>("");
  const [files, setFiles] = useState<ResumeOut[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [renameTarget, setRenameTarget] = useState<ResumeOut | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ResumeOut | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchResumes = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await api.get<ResumeListOut>("/api/resume");
      setFiles(res.data.resumes);
    } catch (err) {
      setError("Could not load your resumes. Please try again.");
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  async function uploadFile(file: File) {
    if (!isAcceptedFile(file)) {
      setError("Only PDF and DOCX files are supported.");
      toast.error("Unsupported file type");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File exceeds the 5MB limit. Please upload a smaller file.");
      toast.error("File exceeds the 5MB limit");
      return;
    }

    if (file.size > WARN_FILE_SIZE_BYTES) {
      toast.warning("Large resume detected — upload may take longer");
    }

    setError(null);
    setState("uploading");
    setUploadingName(file.name);
    setProgress(0);

    const toastId = toast.loading("Uploading resume...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await api.post<ResumeOut>("/api/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });

      setState("done");
      await fetchResumes();
      toast.success("Resume uploaded successfully", { id: toastId });
      addNotification({
        type: "resume_upload",
        title: "Resume uploaded",
        description: `${file.name} was uploaded successfully.`,
      });
      invalidateSearchCache();

      const uploadedResumeId = uploadRes.data?.id;
      if (uploadedResumeId) {
        triggerAtsAnalysis(uploadedResumeId);
      }

      setTimeout(() => {
        setState("idle");
        setProgress(0);
        setUploadingName("");
      }, 1200);
    } catch (err) {
      setError("Upload failed. Please try again.");
      toast.error(getApiErrorMessage(err) || "Upload failed", { id: toastId });
      setState("idle");
      setProgress(0);
      setUploadingName("");
    }
  }

  function handleBrowseClick() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }

  async function viewResume(file: ResumeOut) {
    setBusyId(file.id);
    setError(null);
    try {
      const res = await api.get(`/api/resume/${file.id}/view`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: file.content_type });
      const url = URL.createObjectURL(blob);

      if (file.content_type === "application/pdf") {
        window.open(url, "_blank");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError("Could not open the resume. Please try again.");
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function downloadResume(file: ResumeOut) {
    setBusyId(file.id);
    setError(null);
    try {
      const res = await api.get(`/api/resume/${file.id}/download`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: file.content_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError("Could not download the resume. Please try again.");
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function openRenameDialog(file: ResumeOut) {
    setRenameTarget(file);
    setRenameValue(displayNameOf(file));
  }

  async function submitRename() {
    if (!renameTarget || !renameValue.trim()) return;
    setRenameSaving(true);
    setError(null);
    try {
      await api.patch(`/api/resume/${renameTarget.id}`, { name: renameValue.trim() });
      setRenameTarget(null);
      await fetchResumes();
      toast.success("Resume renamed successfully");
      addNotification({
        type: "resume_rename",
        title: "Resume renamed",
        description: `Resume renamed to "${renameValue.trim()}".`,
      });
      invalidateSearchCache();
    } catch (err) {
      setError("Could not rename the resume. Please try again.");
      toast.error(getApiErrorMessage(err));
    } finally {
      setRenameSaving(false);
    }
  }

  async function setDefault(file: ResumeOut) {
    setBusyId(file.id);
    setError(null);
    try {
      await api.patch(`/api/resume/${file.id}/default`);
      await fetchResumes();
      toast.success("Default resume updated");
      addNotification({
        type: "resume_default",
        title: "Default resume changed",
        description: `${displayNameOf(file)} is now your default resume.`,
      });
      invalidateSearchCache();
    } catch (err) {
      setError("Could not set default resume. Please try again.");
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const id = deleteTarget.id;
    const name = displayNameOf(deleteTarget);
    const previous = files;
    setFiles((prev) => prev.filter((f) => f.id !== id));
    try {
      await api.delete(`/api/resume/${id}`);
      setDeleteTarget(null);
      await fetchResumes();
      toast.success("Resume deleted successfully");
      addNotification({
        type: "resume_delete",
        title: "Resume deleted",
        description: `${name} was permanently removed.`,
      });
      invalidateSearchCache();
    } catch (err) {
      setError("Could not delete the resume. Please try again.");
      toast.error(getApiErrorMessage(err));
      setFiles(previous);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Resume Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a resume to run ATS scoring, JD matching, and skill gap analysis.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              {state === "idle" && (
                <>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UploadCloud className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Drag and drop your resume here</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports PDF and DOCX, up to 5MB</p>
                  </div>
                  <Button className="mt-2" onClick={handleBrowseClick}>
                    Browse files
                  </Button>
                </>
              )}
              {state === "uploading" && (
                <div className="w-full max-w-sm space-y-3">
                  <Loader2 className="h-6 w-6 text-primary mx-auto animate-spin" />
                  <p className="text-sm font-medium truncate">Uploading {uploadingName}</p>
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground">{progress}%</p>
                </div>
              )}
              {state === "done" && (
                <div className="space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
                  <p className="text-sm font-medium">Upload complete — analysis ready</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your resumes</CardTitle>
            <CardDescription>
              {loadingList ? "Loading…" : `${files.length} files uploaded`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingList && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingList &&
              files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 rounded-md border border-border p-4 hover:bg-secondary/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-md bg-secondary flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{displayNameOf(file)}</p>
                      {file.is_default && (
                        <Badge variant="success" className="shrink-0">
                          ⭐ Default Resume
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.file_size_kb)} · Uploaded {formatUploadedAt(file.uploaded_at)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {file.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={busyId === file.id}>
                        {busyId === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => viewResume(file)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadResume(file)}>
                        <Download className="mr-2 h-4 w-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openRenameDialog(file)}>
                        <Pencil className="mr-2 h-4 w-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDefault(file)}>
  <Star className="mr-2 h-4 w-4" />
  {file.is_default ? "Unset Default" : "Set Default"}
</DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/ats-report?resume_id=${file.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View ATS report
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/jd-matcher?resume_id=${file.id}`}>
                          <Target className="mr-2 h-4 w-4" /> View JD Match
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/skill-gap?resume_id=${file.id}`}>
                          <BarChart3 className="mr-2 h-4 w-4" /> View Skill Gap Analysis
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/eligibility-checker?resume_id=${file.id}`}>
                          <ShieldCheck className="mr-2 h-4 w-4" /> View Eligibility
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(file)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            {!loadingList && files.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No resumes uploaded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rename modal */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename resume</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter a new name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)} disabled={renameSaving}>
              Cancel
            </Button>
            <Button onClick={submitRename} disabled={renameSaving || !renameValue.trim()}>
              {renameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget ? displayNameOf(deleteTarget) : ""}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the resume file and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}