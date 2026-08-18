import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Copy, RotateCcw, SendHorizontal, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { runAIChat } from "@/lib/ai.functions";
import { pushHistory } from "@/lib/history";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant Chatbot — Lethuxolo's AI Suite" },
      {
        name: "description",
        content:
          "Chat with your productivity assistant: summarize text, draft follow-ups and plan your day.",
      },
      { property: "og:title", content: "AI Assistant Chatbot" },
      {
        property: "og:description",
        content: "A clean chat workspace with quick prompts and multi-line input.",
      },
    ],
  }),
  component: AssistantTool,
});

type Message = { id: string; role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "Summarize this text",
  "Draft a follow-up",
  "Turn these notes into action items",
  "Rewrite this more concisely",
];

const SYSTEM =
  "You are the AI assistant inside Lethuxolo's AI Productivity Suite. Be concise, practical and structured. Use short paragraphs or bullet lists. Never invent facts the user did not provide.";

function AssistantTool() {
  const run = useServerFn(runAIChat);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text = input) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { id: crypto.randomUUID(), role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await run({
        data: {
          system: SYSTEM,
          messages: next.map(({ role, content: c }) => ({ role, content: c })),
        },
      });
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: res.text },
      ]);
      pushHistory("AI Assistant Chatbot", content.slice(0, 70));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The assistant could not reply.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="AI Assistant Chatbot"
      description="A focused chat workspace — ask follow-ups, paste text, or start from a quick prompt."
    >
      <div className="panel flex h-[calc(100vh-320px)] min-h-[460px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-primary">
              <Bot className="size-4" />
            </span>
            Assistant
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => setMessages([])}
            >
              <RotateCcw className="mr-1.5 size-3.5" /> New chat
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md py-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent text-primary">
                <Bot className="size-6" />
              </span>
              <p className="mt-4 font-medium">How can I help you today?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a quick prompt below or type your own message.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && (
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                  <Bot className="size-4" />
                </span>
              )}
              <div className={cn("max-w-[80%]", m.role === "user" && "text-right")}>
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground",
                  )}
                >
                  {m.content}
                </div>
                {m.role === "assistant" && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                      toast.success("Copied");
                    }}
                    className="mt-1 inline-flex items-center gap-1 px-4 text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Copy className="size-3" /> Copy
                  </button>
                )}
              </div>
              {m.role === "user" && (
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-secondary">
                  <User className="size-4" />
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-lg bg-accent text-primary">
                <Bot className="size-4" />
              </span>
              <span className="flex items-center gap-1 rounded-2xl px-2 py-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
                <span className="ml-2 text-xs text-muted-foreground">Assistant is typing…</span>
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setInput((prev) => (prev ? `${prev}\n${p}: ` : `${p}: `))}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
              placeholder="Message the assistant… (Enter to send, Shift+Enter for a new line)"
              className="max-h-40 min-h-[52px] flex-1 resize-none rounded-xl bg-surface text-sm"
            />
            <Button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              size="icon"
              className="size-11 shrink-0 rounded-xl"
              aria-label="Send message"
            >
              <SendHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
