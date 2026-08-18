import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Columns3,
  List,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generatePlan } from "@/lib/ai.functions";
import { pushHistory } from "@/lib/history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Lethuxolo's AI Suite" },
      {
        name: "description",
        content:
          "Turn any goal into a prioritized task board with durations, categories and editable sub-tasks.",
      },
      { property: "og:title", content: "AI Task Planner" },
      {
        property: "og:description",
        content: "Break a project goal into a kanban board of prioritized, estimated sub-tasks.",
      },
    ],
  }),
  component: PlannerTool,
});

type Status = "todo" | "doing" | "done";
type Task = {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  duration: string;
  category: string;
  status: Status;
};

const COLUMNS: Array<{ key: Status; label: string }> = [
  { key: "todo", label: "To do" },
  { key: "doing", label: "In progress" },
  { key: "done", label: "Done" },
];

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  High: "border-destructive/50 text-destructive",
  Medium: "border-primary/50 text-primary",
  Low: "border-border text-muted-foreground",
};

function PlannerTool() {
  const run = useServerFn(generatePlan);
  const [goal, setGoal] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<"board" | "list">("board");
  const [loading, setLoading] = useState(false);

  const update = (id: string, patch: Partial<Task>) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const plan = async () => {
    if (!goal.trim()) {
      toast.error("Describe your goal or project first.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { goal } });
      setTasks(res.tasks.map((t) => ({ ...t, id: crypto.randomUUID() })));
      pushHistory("AI Task Planner", goal.slice(0, 70));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Planning failed.");
    } finally {
      setLoading(false);
    }
  };

  const addTask = (status: Status = "todo") =>
    setTasks((ts) => [
      ...ts,
      {
        id: crypto.randomUUID(),
        title: "New task",
        priority: "Medium",
        duration: "1 day",
        category: "General",
        status,
      },
    ]);

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="panel bg-surface p-3 hover:border-primary/50">
      <div className="flex items-start gap-2">
        <button
          onClick={() => update(task.id, { status: task.status === "done" ? "todo" : "done" })}
          aria-label="Toggle complete"
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-border transition-colors",
            task.status === "done" && "border-primary bg-primary text-primary-foreground",
          )}
        >
          {task.status === "done" && <Check className="size-3" />}
        </button>
        <input
          value={task.title}
          onChange={(e) => update(task.id, { title: e.target.value })}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm outline-none",
            task.status === "done" && "text-muted-foreground line-through",
          )}
        />
        <button
          onClick={() => setTasks((ts) => ts.filter((t) => t.id !== task.id))}
          aria-label="Remove task"
          className="text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <select
          value={task.priority}
          onChange={(e) => update(task.id, { priority: e.target.value as Task["priority"] })}
          className={cn(
            "rounded-full border bg-transparent px-2 py-0.5 outline-none",
            PRIORITY_STYLES[task.priority],
          )}
        >
          {(["High", "Medium", "Low"] as const).map((p) => (
            <option key={p} value={p} className="bg-popover text-popover-foreground">
              {p}
            </option>
          ))}
        </select>
        <input
          value={task.duration}
          onChange={(e) => update(task.id, { duration: e.target.value })}
          className="w-20 rounded-full border border-border bg-transparent px-2 py-0.5 text-muted-foreground outline-none"
        />
        <input
          value={task.category}
          onChange={(e) => update(task.id, { category: e.target.value })}
          className="w-24 rounded-full border border-border bg-transparent px-2 py-0.5 text-muted-foreground outline-none"
        />
        {view === "board" && (
          <select
            value={task.status}
            onChange={(e) => update(task.id, { status: e.target.value as Status })}
            className="rounded-full border border-border bg-transparent px-2 py-0.5 text-muted-foreground outline-none"
          >
            {COLUMNS.map((c) => (
              <option key={c.key} value={c.key} className="bg-popover text-popover-foreground">
                {c.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  return (
    <AppShell
      title="AI Task Planner"
      description="Describe the outcome you want. Get prioritized sub-tasks with estimates you can edit, complete or remove."
    >
      <div className="panel flex flex-col gap-4 p-5 md:flex-row md:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="goal">Goal or project description</Label>
          <Input
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void plan()}
            placeholder="Launch app MVP in 2 weeks"
            className="rounded-xl"
          />
        </div>
        <Button onClick={plan} disabled={loading} className="rounded-xl md:w-44">
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 size-4" />
          )}
          Generate plan
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-border p-1">
          {(
            [
              { key: "board", label: "Board", icon: Columns3 },
              { key: "list", label: "List", icon: List },
            ] as const
          ).map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                view === v.key ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <v.icon className="size-4" />
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {tasks.filter((t) => t.status === "done").length}/{tasks.length} complete
          </span>
          <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => addTask()}>
            <Plus className="mr-1.5 size-3.5" /> Add task
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="panel mt-4 p-8 text-center text-sm text-muted-foreground">
          No tasks yet — generate a plan or add one manually.
        </p>
      ) : view === "board" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.key} className="rounded-2xl border border-border bg-surface/50 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-sm font-medium">{col.label}</p>
                <span className="text-xs text-muted-foreground">
                  {tasks.filter((t) => t.status === col.key).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status === col.key)
                  .map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                <button
                  onClick={() => addTask(col.key)}
                  className="w-full rounded-xl border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
