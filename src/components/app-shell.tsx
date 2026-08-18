import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  Check,
  ChevronLeft,
  LayoutDashboard,
  ListChecks,
  Mail,
  Moon,
  NotebookPen,
  Search,
  ShieldAlert,
  Sun,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, blurb: "Overview & recent generations" },
  { to: "/email", label: "Smart Email Generator", icon: Mail, blurb: "Draft emails in any tone" },
  {
    to: "/meetings",
    label: "Meeting Notes Summarizer",
    icon: NotebookPen,
    blurb: "Summary, actions, decisions",
  },
  { to: "/planner", label: "AI Task Planner", icon: ListChecks, blurb: "Goal to kanban board" },
  { to: "/assistant", label: "AI Assistant Chatbot", icon: Bot, blurb: "Chat with your assistant" },
] as const;

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("laps-theme");
    const next = stored === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("laps-theme", next);
      return next;
    });
  };

  return { theme, toggle };
}

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_ITEMS.filter(
      (i) => i.label.toLowerCase().includes(q) || i.blurb.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 md:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Lethuxolo&apos;s</p>
              <p className="truncate text-xs text-muted-foreground">AI Productivity Suite</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon
                  className={cn("size-[18px] shrink-0", active && "text-sidebar-primary")}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-8">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
              <h2 className="truncate text-base font-semibold">
                Lethuxolo&apos;s AI Productivity Suite
              </h2>
            </div>

            <div className="relative order-3 w-full md:order-none md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools…"
                className="rounded-xl pl-9"
                aria-label="Universal search"
              />
              {results.length > 0 && (
                <div className="absolute left-0 right-0 top-[110%] z-30 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                  {results.map((r) => (
                    <Link
                      key={r.to}
                      to={r.to}
                      onClick={() => setQuery("")}
                      className="flex flex-col gap-0.5 px-3 py-2 transition-colors hover:bg-accent"
                    >
                      <span className="text-sm">{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.blurb}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="rounded-xl"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5">
              <span className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                LM
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-medium">Lethuxolo M.</p>
                <p className="text-[11px] text-muted-foreground">Pro workspace</p>
              </div>
              <Check className="hidden size-3.5 text-primary sm:block" />
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-t border-border px-2 py-2 md:hidden">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors",
                  pathname === item.to
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label.split(" ")[0]}
              </Link>
            ))}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
              {description && (
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {children}
          </div>
        </main>

        <footer className="sticky bottom-0 border-t border-border bg-surface/95 backdrop-blur">
          <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 text-[11px] leading-snug text-muted-foreground md:px-8">
            <ShieldAlert className="size-3.5 shrink-0 text-primary" />
            <span>
              Responsible AI Disclaimer: AI-generated outputs may contain inaccurate. Please review
              and verify key details before publishing.
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
}
