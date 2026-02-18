"use client";

import {
  BarChart3,
  LayoutDashboard,
  Building2,
  History,
  FileText,
  ShieldCheck,
  Settings,
  CalendarDays,
  ShieldAlert,
  LifeBuoy,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import { SessionSwitcher } from "./session-switcher";
import { SupportFeedbackDialog } from "@/components/support-feedback-dialog";
import React from "react";

const senateNavigation = [
  {
    name: "University Dashboard",
    href: "/senate",
    icon: LayoutDashboard,
  },
  {
    name: "Final Approvals",
    href: "/senate/approvals",
    icon: ShieldCheck,
  },
  {
    name: "Institutional Analytics",
    href: "/senate/analytics",
    icon: BarChart3,
  },
  {
    name: "Faculty Overview",
    href: "/senate/faculties",
    icon: Building2,
  },
  {
    name: "Academic Sessions",
    href: "/senate/sessions",
    icon: CalendarDays,
  },
  {
    name: "Exception Management",
    href: "/senate/exceptions",
    icon: ShieldAlert,
  },
  {
    name: "Approval Records",
    href: "/senate/history",
    icon: History,
  },
];

export function SenateSidebar() {
  const pathname = usePathname();
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/senate" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            University Senate
          </span>
        </Link>
      </div>

      <div className="px-4 py-4 border-b bg-muted/30">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 px-2">
          Academic Context
        </p>
        <SessionSwitcher />
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {senateNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-primary group-hover:text-foreground",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 px-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Governance & Compliance
          </p>
          <div className="mt-4 space-y-4">
            <Link
              href="/senate/audit"
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Audit Trails
            </Link>
            <Link
              href="/senate/settings"
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Senate Settings
            </Link>
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              Support
            </button>
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Feedback
            </button>
          </div>
        </div>
      </div>

      <div className="border-t p-4">
        <div className="rounded-xl bg-primary/5 p-4 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full animate-pulse bg-green-500" />
            <p className="text-[10px] font-bold text-primary uppercase">
              System Secure
            </p>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground font-medium">
            Session active: Final Approval Access granted
          </p>
        </div>
      </div>

      <SupportFeedbackDialog
        type="SUPPORT"
        open={supportOpen}
        onOpenChange={setSupportOpen}
      />
      <SupportFeedbackDialog
        type="FEEDBACK"
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
      />
    </div>
  );
}
