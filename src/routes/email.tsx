import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "@/lib/ai.functions";
import { pushHistory } from "@/lib/history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Lethuxolo's AI Suite" },
      {
        name: "description",
        content: "Generate professional, casual, urgent or persuasive emails from a few key points.",
      },
      { property: "og:title", content: "Smart Email Generator" },
      {
        property: "og:description",
        content: "Draft ready-to-send emails in the tone you need, then copy them in one click.",
      },
    ],
  }),
  component: EmailTool,
});

const TONES = ["Professional", "Casual", "Urgent", "Persuasive"] as const;

function EmailTool() {
  const run = useServerFn(generateEmail);
  const [recipient, setRecipient] = useState("");
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState<string>("Professional");
  const [keyPoints, setKeyPoints] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (nextTone = tone) => {
    if (!goal.trim()) {
      toast.error("Add a goal or intent for the email first.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { recipient, goal, tone: nextTone, keyPoints } });
      setOutput(res.text);
      pushHistory("Smart Email Generator", `${nextTone} email · ${goal.slice(0, 60)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Smart Email Generator"
      description="Describe who you're writing to and what you need — get a send-ready draft you can edit, retone and copy."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="panel space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Thandi, Head of Ops"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal">Goal / intent</Label>
            <Input
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Reschedule Thursday's review"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    "rounded-xl border border-border px-3 py-2 text-sm transition-colors",
                    tone === t
                      ? "border-primary bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="points">Key points</Label>
            <Textarea
              id="points"
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              rows={6}
              placeholder="- Move to Friday 10:00&#10;- Bring Q3 metrics&#10;- Keep it short"
              className="rounded-xl"
            />
          </div>
          <Button onClick={() => generate()} disabled={loading} className="w-full rounded-xl">
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            Generate email
          </Button>
        </div>

        <div className="panel flex min-h-[420px] flex-col p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">Generated email</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!output}
                className="rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  toast.success("Copied to clipboard");
                }}
              >
                <Copy className="mr-1.5 size-3.5" /> Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!output}
                className="rounded-xl"
                onClick={() => setOutput("")}
              >
                <Trash2 className="mr-1.5 size-3.5" /> Remove
              </Button>
            </div>
          </div>

          {output && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Switch tone:</span>
              {TONES.map((t) => (
                <button
                  key={t}
                  disabled={loading}
                  onClick={() => {
                    setTone(t);
                    void generate(t);
                  }}
                  className={cn(
                    "rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-accent",
                    tone === t && "border-primary text-primary",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <Textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="Your generated email appears here and stays fully editable."
            className="mt-4 min-h-[320px] flex-1 rounded-xl bg-surface font-sans text-sm leading-relaxed"
          />
        </div>
      </div>
    </AppShell>
  );
}
