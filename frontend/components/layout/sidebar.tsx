"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  FileSearch,
  Target,
  BarChart3,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume-upload", label: "Resume Upload", icon: UploadCloud },
  { href: "/ats-report", label: "ATS Report", icon: FileSearch },
  { href: "/jd-matcher", label: "JD Matcher", icon: Target },
  { href: "/skill-gap", label: "Skill Gap Analysis", icon: BarChart3 },
  { href: "/eligibility-checker", label: "Eligibility Checker", icon: ShieldCheck },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-border bg-card/40 h-screen sticky top-0">
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}