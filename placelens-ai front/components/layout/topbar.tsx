// components/layout/topbar.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  X,
  CheckCheck,
  Trash2 as TrashIcon,
  FileText,
  FileSearch as FileSearchIcon,
  Target as TargetIcon,
  BarChart3 as BarChart3Icon,
  TrendingUp as TrendingUpIcon,
  ShieldCheck as ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  UploadCloud,
  FileSearch,
  Target,
  BarChart3,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import {
  useNotifications,
  getUnreadCount,
  formatRelativeTime,
  markAllAsRead,
  clearAllNotifications,
  addNotification,
  notificationIcons,
} from "@/lib/notifications";
import { subscribeSearchInvalidation } from "@/lib/search-cache";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume-upload", label: "Resume Upload", icon: UploadCloud },
  { href: "/ats-report", label: "ATS Report", icon: FileSearch },
  { href: "/jd-matcher", label: "JD Matcher", icon: Target },
  { href: "/skill-gap", label: "Skill Gap Analysis", icon: BarChart3 },
  { href: "/eligibility-checker", label: "Eligibility Checker", icon: ShieldCheck },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/resume-upload": "Resume Upload",
  "/ats-report": "ATS Report",
  "/jd-matcher": "JD Matcher",
  "/skill-gap": "Skill Gap Analysis",
  "/eligibility-checker": "Eligibility Checker",
  "/profile": "Profile",
};

interface DisplayUser {
  name: string;
  email: string;
}

interface StoredUserShape {
  full_name?: string;
  name?: string;
  email?: string;
}

interface ProfileMeOut {
  full_name: string;
  email: string;
}

function normalizeStoredUser(raw: StoredUserShape): DisplayUser | null {
  const name = raw.full_name ?? raw.name;
  if (!name || !raw.email) return null;
  return { name, email: raw.email };
}

/* ---------------- Global Search types ---------------- */

interface SearchResumeOut {
  id: number;
  file_name: string;
  display_name: string | null;
  uploaded_at: string;
}
interface SearchResumeListOut {
  total: number;
  resumes: SearchResumeOut[];
}
interface SearchAtsReportOut {
  id: number;
  resume_id: number;
  overall_score: number;
}
interface SearchJDMatchOut {
  id: number;
  role_title: string;
  company: string;
  match_score: number;
}
interface SearchSkillGapOut {
  id: number;
  resume_id: number;
  target_role: string;
  overall_readiness: number;
}
interface SearchEligibilityOut {
  id: number;
  resume_id: number;
  role_title: string;
  company: string;
  result: string;
}
interface SearchReadinessOut {
  overall_readiness: number;
  top_growth_area: string | null;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: typeof FileText;
}

interface SearchGroup {
  label: string;
  items: SearchResultItem[];
}

function displayNameOf(r: SearchResumeOut) {
  return r.display_name && r.display_name.trim().length > 0 ? r.display_name : r.file_name;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before}
      <span className="bg-primary/25 text-foreground rounded-sm">{match}</span>
      {after}
    </>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<DisplayUser | null>(null);
  const notifications = useNotifications();
  const unreadCount = getUnreadCount(notifications);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsed: StoredUserShape = JSON.parse(storedUser);
        const normalized = normalizeStoredUser(parsed);
        if (normalized) {
          setUser(normalized);
          return;
        }
      } catch {
        // fall through to API fetch below
      }
    }

    async function fetchProfile() {
      try {
        const res = await api.get<ProfileMeOut>("/api/profile/me");
        setUser({ name: res.data.full_name, email: res.data.email });
      } catch {
        // Leave user as null — UI falls back to "U" / "User" as before.
      }
    }

    fetchProfile();
  }, []);

  function handleLogout() {
    const name = user?.name;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout successful");
    addNotification({
      type: "logout",
      title: "Logout successful",
      description: name ? `${name} has been signed out.` : "You have been signed out.",
    });
    router.push("/login");
  }

  function handleNotificationsOpenChange(open: boolean) {
    if (open) {
      markAllAsRead();
    }
  }

  /* ---------------- Global Search state ---------------- */
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const resumesRef = useRef<SearchResumeOut[]>([]);
  const atsRef = useRef<SearchAtsReportOut[]>([]);
  const jdRef = useRef<SearchJDMatchOut[]>([]);
  const skillGapRef = useRef<SearchSkillGapOut[]>([]);
  const eligibilityRef = useRef<SearchEligibilityOut[]>([]);
  const readinessRef = useRef<SearchReadinessOut | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef("");

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const loadAllSearchData = useCallback(async () => {
    setSearchLoading(true);
    try {
      const resumeRes = await api.get<SearchResumeListOut>("/api/resume");
      const resumes = resumeRes.data.resumes ?? [];
      resumesRef.current = resumes;

      const atsResults: SearchAtsReportOut[] = [];
      const skillGapResults: SearchSkillGapOut[] = [];
      const eligibilityResults: SearchEligibilityOut[] = [];

      await Promise.all(
        resumes.map(async (r) => {
          try {
            const atsRes = await api.get<SearchAtsReportOut>(`/api/ats/${r.id}`);
            if (atsRes.data) atsResults.push(atsRes.data);
          } catch {
            // no report for this resume
          }
          try {
            const sgRes = await api.get<SearchSkillGapOut[]>(`/api/skill-gap?resume_id=${r.id}`);
            if (Array.isArray(sgRes.data)) skillGapResults.push(...sgRes.data);
          } catch {
            // no skill gap analyses
          }
          try {
            const elRes = await api.get<SearchEligibilityOut[]>(`/api/eligibility?resume_id=${r.id}`);
            if (Array.isArray(elRes.data)) eligibilityResults.push(...elRes.data);
          } catch {
            // no eligibility checks
          }
        })
      );

      atsRef.current = atsResults;
      skillGapRef.current = skillGapResults;
      eligibilityRef.current = eligibilityResults;

      try {
        const jdRes = await api.get<SearchJDMatchOut[]>("/api/jd");
        jdRef.current = Array.isArray(jdRes.data) ? jdRes.data : [];
      } catch {
        jdRef.current = [];
      }

      try {
        const readinessRes = await api.get<SearchReadinessOut>("/api/readiness");
        readinessRef.current = readinessRes.data ?? null;
      } catch {
        readinessRef.current = null;
      }

      setDataLoaded(true);
    } catch {
      // resumes failed to load — leave caches empty
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function computeGroups(q: string): SearchGroup[] {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    const resumeMatches = resumesRef.current.filter((r) =>
      displayNameOf(r).toLowerCase().includes(query)
    );
    const resumeGroup: SearchGroup = {
      label: "Resumes",
      items: resumeMatches.slice(0, 5).map((r) => ({
        id: `resume-${r.id}`,
        title: displayNameOf(r),
        subtitle: "Resume",
        href: "/resume-upload",
        icon: FileText,
      })),
    };

    const atsMatches = atsRef.current.filter((report) => {
      const resume = resumesRef.current.find((r) => r.id === report.resume_id);
      return resume ? displayNameOf(resume).toLowerCase().includes(query) : false;
    });
    const atsGroup: SearchGroup = {
      label: "ATS Reports",
      items: atsMatches.slice(0, 5).map((report) => {
        const resume = resumesRef.current.find((r) => r.id === report.resume_id);
        return {
          id: `ats-${report.id}`,
          title: resume ? displayNameOf(resume) : "ATS Report",
          subtitle: `ATS score: ${report.overall_score}%`,
          href: `/ats-report?resume_id=${report.resume_id}`,
          icon: FileSearchIcon,
        };
      }),
    };

    const jdMatches = jdRef.current.filter(
      (m) =>
        m.role_title.toLowerCase().includes(query) ||
        m.company.toLowerCase().includes(query)
    );
    const jdGroup: SearchGroup = {
      label: "JD Analyses",
      items: jdMatches.slice(0, 5).map((m) => ({
        id: `jd-${m.id}`,
        title: m.role_title,
        subtitle: `${m.company} · ${m.match_score}% match`,
        href: "/jd-matcher",
        icon: TargetIcon,
      })),
    };

    const skillGapMatches = skillGapRef.current.filter((s) =>
      s.target_role.toLowerCase().includes(query)
    );
    const skillGapGroup: SearchGroup = {
      label: "Skill Gap",
      items: skillGapMatches.slice(0, 5).map((s) => ({
        id: `skillgap-${s.id}`,
        title: s.target_role,
        subtitle: `Readiness: ${s.overall_readiness}%`,
        href: `/skill-gap?resume_id=${s.resume_id}`,
        icon: BarChart3Icon,
      })),
    };

    const readinessGroup: SearchGroup = {
      label: "Readiness",
      items:
        readinessRef.current &&
        ("readiness".includes(query) ||
          (readinessRef.current.top_growth_area || "").toLowerCase().includes(query))
          ? [
              {
                id: "readiness-overall",
                title: "Readiness Score",
                subtitle: `${readinessRef.current.overall_readiness}% overall readiness`,
                href: "/dashboard",
                icon: TrendingUpIcon,
              },
            ]
          : [],
    };

    const eligibilityMatches = eligibilityRef.current.filter(
      (e) =>
        e.role_title.toLowerCase().includes(query) ||
        e.company.toLowerCase().includes(query)
    );
    const eligibilityGroup: SearchGroup = {
      label: "Eligibility",
      items: eligibilityMatches.slice(0, 5).map((e) => ({
        id: `eligibility-${e.id}`,
        title: e.role_title,
        subtitle: `${e.company} · ${e.result === "eligible" ? "Eligible" : "Not eligible"}`,
        href: `/eligibility-checker?resume_id=${e.resume_id}`,
        icon: ShieldCheckIcon,
      })),
    };

    return [resumeGroup, atsGroup, jdGroup, skillGapGroup, readinessGroup, eligibilityGroup].filter(
      (g) => g.items.length > 0
    );
  }

  // Refresh search data automatically whenever an action elsewhere in the
  // app invalidates the cache (resume upload/rename/delete/default, skill
  // gap analysis, etc). No page refresh required.
  useEffect(() => {
    const unsubscribe = subscribeSearchInvalidation(async () => {
      await loadAllSearchData();
      if (queryRef.current.trim()) {
        setGroups(computeGroups(queryRef.current));
      }
    });
    return unsubscribe;
  }, [loadAllSearchData]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    setSearchOpen(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      if (!value.trim()) {
        setGroups([]);
        return;
      }
      if (!dataLoaded) {
        await loadAllSearchData();
      }
      setGroups(computeGroups(value));
    }, 300);
  }

  function handleSearchFocus() {
    if (query.trim()) {
      setSearchOpen(true);
    }
  }

  function handleResultClick(href: string) {
    setSearchOpen(false);
    setQuery("");
    setGroups([]);
    router.push(href);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    }
    if (searchOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const totalResults = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-full items-center gap-4 px-4 lg:px-6">
        <button
          className="lg:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="lg:hidden">
          <Logo />
        </div>

        <h1 className="hidden lg:block font-display text-lg font-semibold tracking-tight">
          {titles[pathname] ?? "PlaceLens  AI"}
        </h1>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden md:block" ref={searchContainerRef}>
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Search roles, resumes..."
              className="w-64 pl-8"
              value={query}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              autoComplete="off"
            />

            {searchOpen && query.trim() && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-96 max-h-[28rem] overflow-y-auto rounded-lg border border-border bg-popover shadow-2xl z-50 animate-fade-in">
                {searchLoading && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}

                {!searchLoading && totalResults === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No matching results found.
                  </div>
                )}

                {!searchLoading &&
                  groups.map((group) => (
                    <div key={group.label} className="py-1.5">
                      <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </p>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleResultClick(item.href)}
                            className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-secondary/60 transition-colors"
                          >
                            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {highlightMatch(item.title, query)}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {item.subtitle}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <DropdownMenu onOpenChange={handleNotificationsOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllNotifications();
                      }}
                      className="flex items-center gap-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                      title="Clear all"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <DropdownMenuSeparator />

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                )}
                {notifications.map((n) => {
                  const Icon = notificationIcons[n.type];
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-2.5 px-2 py-2.5 text-sm rounded-sm",
                        !n.read && "bg-primary/5"
                      )}
                    >
                      <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-secondary transition-colors">
                <Avatar className="h-7 w-7">
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-foreground">{user?.name || "User"}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email || ""}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <UserRound className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 z-50 h-full w-72 bg-background border-r border-border shadow-2xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <Logo />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}