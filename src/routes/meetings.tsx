import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting } from "@/lib/ai.functions";
import { pushHistory } from "@/lib/history";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Lethuxolo's AI Suite" },
      {
        name: "description",
        content:
          "Paste or upload a transcript and get an editable executive summary, action items and decisions.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer" },
      {
        property: "og:description",
        content: "Turn raw meeting notes into a summary, action items and decisions made.",
      },
    ],
  }),
  component: MeetingsTool,
});

type Sections = { summary: string; actions: string; decisions: string };

const EMPTY: Sections = { summary: "", actions: "", decisions: "" };

function MeetingsTool() {
  const run = useServerFn(summarizeMeeting);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [transcript, setTranscript] = useState("");
  const [sections, setSections] = useState<Sections>(EMPTY);
  const [loading, setLoading] = useState(false);

  const hasOutput = Boolean(sections.summary || sections.actions || sections.decisions);

  const summarize = async () => {
    if (!transcript.trim()) {
      toast.error("Paste or upload your meeting notes first.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { title, date, transcript } });
      setSections(res);
      pushHistory("Meeting Notes Summarizer", title.trim() || "Untitled meeting summary");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Summarization failed.");
    } finally {
      setLoading(false);
    }
  };

  const blocks: Array<{ key: keyof Sections; label: string }> = [
    { key: "summary", label: "Executive Summary" },
    { key: "actions", label: "Key Action Items" },
    { key: "decisions", label: "Decisions Made" },
  ];

  return (
    <AppShell
      title="Meeting Notes Summarizer"
      description="Drop in raw notes or a transcript. Every generated section stays directly editable."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="panel space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="mtitle">Meeting title</Label>
            <Input
              id="mtitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q3 Product Review"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mdate">Date</Label>
            <Input
              id="mdate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="transcript">Raw transcript / notes</Label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-primary hover:underline">
                <Upload className="size-3.5" /> Upload .txt
                <input
                  type="file"
                  accept=".txt,.md,text/plain"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setTranscript(await file.text());
                    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
                    toast.success("Notes loaded");
                  }}
                />
              </label>
            </div>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={12}
              placeholder="Paste the transcript or your rough notes here…"
              className="rounded-xl"
            />
          </div>
          <Button onClick={summarize} disabled={loading} className="w-full rounded-xl">
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            Summarize notes
          </Button>
        </div>

        <div className="space-y-4">
          {blocks.map((b) => (
            <div key={b.key} className="panel p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{b.label}</p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!sections[b.key]}
                    className="rounded-xl"
                    onClick={() => {
                      navigator.clipboard.writeText(sections[b.key]);
                      toast.success(`${b.label} copied`);
                    }}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!sections[b.key]}
                    className="rounded-xl"
                    onClick={() => setSections((s) => ({ ...s, [b.key]: "" }))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={sections[b.key]}
                onChange={(e) => setSections((s) => ({ ...s, [b.key]: e.target.value }))}
                rows={b.key === "summary" ? 6 : 5}
                placeholder={`${b.label} will appear here — edit freely.`}
                className="mt-3 rounded-xl bg-surface text-sm leading-relaxed"
              />
            </div>
          ))}

          {hasOutput && (
            <Button
              variant="secondary"
              className="rounded-xl"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${title || "Meeting"} (${date || "no date"})\n\nEXECUTIVE SUMMARY\n${sections.summary}\n\nKEY ACTION ITEMS\n${sections.actions}\n\nDECISIONS MADE\n${sections.decisions}`,
                );
                toast.success("Full summary copied");
              }}
            >
              <Copy className="mr-2 size-4" /> Copy full summary
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
