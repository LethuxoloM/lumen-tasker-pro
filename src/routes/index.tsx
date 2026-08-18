import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Bot, ListChecks, Mail, NotebookPen, Sparkle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { clearHistory, readHistory, type Generation } from "@/lib/history";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Lethuxolo's AI Productivity Suite" },
      {
        name: "description",
        content:
          "Overview metrics, quick-start AI tools and recent generations inside Lethuxolo's AI Productivity Suite.",
      },
      { property: "og:title", content: "Lethuxolo's AI Productivity Suite" },
      {
        property: "og:description",
        content: "AI email drafting, meeting summaries, task planning and an assistant chatbot.",
      },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  {
    to: "/email" as const,
    label: "Smart Email Generator",
    copy: "Turn a goal and a few bullets into a polished email.",
    icon: Mail,
  },
  {
    to: "/meetings" as const,
    label: "Meeting Notes Summarizer",
    copy: "Executive summary, action items and decisions made.",
    icon: NotebookPen,
  },
  {
    to: "/planner" as const,
    label: "AI Task Planner",
    copy: "Break a goal into a prioritized kanban board.",
    icon: ListChecks,
  },
  {
    to: "/assistant" as const,
    label: "AI Assistant Chatbot",
    copy: "Ask anything, draft anything, iterate fast.",
    icon: Bot,
  },
];

function Dashboard() {
  const [history, setHistory] = useState<Generation[]>([]);

  useEffect(() => {
    const sync = () => setHistory(readHistory());
    sync();
    window.addEventListener("laps-history", sync);
    return () => window.removeEventListener("laps-history", sync);
  }, []);

  const today = history.filter((h) => Date.now() - h.at < 86_400_000).length;
  const toolsUsed = new Set(history.map((h) => h.tool)).size;

  const metrics = [
    { label: "Total generations", value: history.length },
    { label: "Generated today", value: today },
    { label: "Tools used", value: `${toolsUsed}/4` },
    { label: "Time saved (est.)", value: `${history.length * 12} min` },
  ];

  return (
    <AppShell
      title="Dashboard"
      description="Your AI workspace at a glance — metrics, quick-start tools and everything you generated recently."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="panel p-4 hover:border-primary/50">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="mt-2 text-2xl font-semibold">{m.value}</p>
          </div>
        ))}
      </div>

      <h3 className="mb-3 mt-8 text-sm uppercase tracking-wider text-muted-foreground">
        Quick start
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {TOOLS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="panel group flex items-start gap-4 p-5 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-glow"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
              <t.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 font-medium">
                {t.label}
                <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{t.copy}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">
          Recent AI generations
        </h3>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => clearHistory()} className="rounded-xl">
            <Trash2 className="mr-1.5 size-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className="panel mt-3 divide-y divide-border">
        {history.length === 0 && (
          <p className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <Sparkle className="size-4 text-primary" /> Nothing yet — generate something from a tool
            above.
          </p>
        )}
        {history.map((h) => (
          <div key={h.id} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm">{h.title}</p>
              <p className="text-xs text-muted-foreground">{h.tool}</p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              {new Date(h.at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
