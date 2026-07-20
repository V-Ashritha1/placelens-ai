// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  X,
  Check,
  Briefcase,
  Loader2,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { profileSkills } from "@/lib/dummy-data";
import api from "@/lib/api";
import {
  useExperience,
  addExperience,
  updateExperience,
  deleteExperience,
  formatPeriod,
  type ExperienceEntry,
} from "@/lib/experience";

interface UserOut {
  id: number;
  full_name: string;
  email: string;
  role_title: string | null;
  location: string | null;
  plan: string;
  is_active: boolean;
  created_at: string;
}

function formatMemberSince(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function initialsFromName(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase() || "U";
}

interface ExperienceFormState {
  company: string;
  title: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isPresent: boolean;
  bullets: string[];
}

const emptyForm: ExperienceFormState = {
  company: "",
  title: "",
  employmentType: "",
  startDate: "",
  endDate: "",
  isPresent: false,
  bullets: [""],
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");

  // Not backed by the API yet — the User model has no skills/experience
  // fields or endpoints. Kept as local component state so the existing
  // UI and interactions are fully preserved without touching the schema.
  const [skills, setSkills] = useState(profileSkills);
  const [newSkill, setNewSkill] = useState("");

  const experience = useExperience();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExperienceFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ExperienceEntry | null>(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await api.get<UserOut>("/api/profile/me");
        setUser(res.data);
        setName(res.data.full_name);
        setRole(res.data.role_title ?? "");
        setLocation(res.data.location ?? "");
      } catch {
        setLoadError("Could not load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function addSkill() {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setNewSkill("");
  }

  async function handleEditToggle() {
    if (!editing) {
      setEditing(true);
      return;
    }

    if (!user) return;

    setSaving(true);
    setSaveError(null);

    try {
      const res = await api.put<UserOut>("/api/profile/me", {
        full_name: name,
        role_title: role,
        location: location,
      });
      setUser(res.data);
      setName(res.data.full_name);
      setRole(res.data.role_title ?? "");
      setLocation(res.data.location ?? "");
      setEditing(false);
    } catch {
      setSaveError("Could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function openAddExperience() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditExperience(exp: ExperienceEntry) {
    setEditingId(exp.id);
    setForm({
      company: exp.company,
      title: exp.title,
      employmentType: exp.employmentType,
      startDate: exp.startDate,
      endDate: exp.endDate,
      isPresent: exp.isPresent,
      bullets: exp.bullets.length > 0 ? exp.bullets : [""],
    });
    setFormOpen(true);
  }

  function updateBullet(index: number, value: string) {
    setForm((prev) => {
      const next = [...prev.bullets];
      next[index] = value;
      return { ...prev, bullets: next };
    });
  }

  function addBulletField() {
    setForm((prev) => ({ ...prev, bullets: [...prev.bullets, ""] }));
  }

  function removeBulletField(index: number) {
    setForm((prev) => ({
      ...prev,
      bullets: prev.bullets.filter((_, i) => i !== index),
    }));
  }

  function submitExperienceForm() {
    if (!form.company.trim() || !form.title.trim() || !form.startDate.trim()) {
      return;
    }

    const cleanedBullets = form.bullets.map((b) => b.trim()).filter(Boolean);

    const payload = {
      company: form.company.trim(),
      title: form.title.trim(),
      employmentType: form.employmentType.trim(),
      startDate: form.startDate.trim(),
      endDate: form.isPresent ? "" : form.endDate.trim(),
      isPresent: form.isPresent,
      bullets: cleanedBullets,
    };

    if (editingId) {
      updateExperience(editingId, payload);
    } else {
      addExperience(payload);
    }

    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function confirmDeleteExperience() {
    if (!deleteTarget) return;
    deleteExperience(deleteTarget.id);
    setDeleteTarget(null);
  }

  const isFormValid = form.company.trim() && form.title.trim() && form.startDate.trim();

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AppShell>
    );
  }

  if (loadError || !user) {
    return (
      <AppShell>
        <p className="text-sm text-destructive">{loadError ?? "Could not load your profile."}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your personal details and preferences.</p>
          </div>
          <Button variant={editing ? "default" : "outline"} onClick={handleEditToggle} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editing ? (
              <Check className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            {saving ? "Saving..." : editing ? "Save changes" : "Edit profile"}
          </Button>
        </div>

        {saveError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {saveError}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="text-xl">{initialsFromName(name)}</AvatarFallback>
              </Avatar>
              <p className="font-display text-lg font-semibold">{name}</p>
              <p className="text-sm text-muted-foreground">{role}</p>
              <Badge variant="outline" className="mt-3">
  {user.plan} plan
</Badge>
              <Separator className="my-5" />
              <div className="w-full space-y-2 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>{location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span>{formatMemberSince(user.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal information</CardTitle>
                    <CardDescription>This is used to personalize your reports and matches</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Current role</Label>
                        <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} disabled={!editing} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          disabled={!editing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user.email} disabled />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills</CardTitle>
                    <CardDescription>Used to power skill gap analysis and JD matching</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1 pr-1.5">
                          {skill}
                          <button
                            onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))}
                            className="rounded-full hover:bg-background/60 p-0.5"
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill, e.g. Docker"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSkill()}
                      />
                      <Button variant="outline" onClick={addSkill}>
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                    <div>
                      <CardTitle>Work experience</CardTitle>
                      <CardDescription>
                        {experience.length > 0
                          ? "Manage the roles that power your resume analysis"
                          : "No work experience found."}
                      </CardDescription>
                    </div>
                    {experience.length > 0 && (
                      <Button size="sm" onClick={openAddExperience}>
                        <Plus className="h-4 w-4" /> Add Experience
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {experience.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">No work experience found.</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add your work history to improve resume analysis and matching.
                          </p>
                        </div>
                        <Button onClick={openAddExperience}>
                          <Plus className="h-4 w-4" /> Add Experience
                        </Button>
                      </div>
                    ) : (
                      experience.map((exp) => (
                        <div key={exp.id} className="flex gap-4 group">
                          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Briefcase className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium">
                                  {exp.title} · {exp.company}
                                  {exp.employmentType && (
                                    <span className="text-muted-foreground"> · {exp.employmentType}</span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mb-1">{formatPeriod(exp)}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditExperience(exp)}
                                  aria-label="Edit experience"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTarget(exp)}
                                  aria-label="Delete experience"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {exp.bullets.length > 0 && (
                              <ul className="list-disc list-inside space-y-0.5 mt-1">
                                {exp.bullets.map((bullet, i) => (
                                  <li key={i} className="text-sm text-muted-foreground">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add / Edit experience modal */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && setFormOpen(false)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit experience" : "Add experience"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-company">Company name</Label>
                <Input
                  id="exp-company"
                  value={form.company}
                  onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g. Stripe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-title">Job title</Label>
                <Input
                  id="exp-title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exp-type">Employment type (optional)</Label>
              <Input
                id="exp-type"
                value={form.employmentType}
                onChange={(e) => setForm((prev) => ({ ...prev, employmentType: e.target.value }))}
                placeholder="e.g. Full-time, Contract, Internship"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-start">Start date</Label>
                <Input
                  id="exp-start"
                  type="month"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-end">End date</Label>
                <Input
                  id="exp-end"
                  type="month"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  disabled={form.isPresent}
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                  <Checkbox
                    checked={form.isPresent}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, isPresent: checked === true }))
                    }
                  />
                  I currently work here
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <div className="space-y-2">
                {form.bullets.map((bullet, i) => (
                  <div key={i} className="flex gap-2">
                    <Textarea
                      value={bullet}
                      onChange={(e) => updateBullet(i, e.target.value)}
                      placeholder="e.g. Led migration to a micro-frontend architecture"
                      className="min-h-[60px]"
                    />
                    {form.bullets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeBulletField(i)}
                        aria-label="Remove bullet"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addBulletField}>
                <Plus className="h-4 w-4" /> Add bullet point
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitExperienceForm} disabled={!isFormValid}>
              {editingId ? "Save changes" : "Add experience"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{deleteTarget ? `${deleteTarget.title} · ${deleteTarget.company}` : ""}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this experience entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExperience}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}