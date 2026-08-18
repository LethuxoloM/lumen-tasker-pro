import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "google/gemini-3.7-flash";

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function callGateway(messages: Msg[]) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet (missing API key).");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({ model: MODEL, messages, stream: false }),
  });

  if (!res.ok) {
    const body = await res.text();
    let message = body;
    try {
      message = JSON.parse(body)?.error?.message ?? body;
    } catch {
      /* keep raw body */
    }
    if (res.status === 429) throw new Error("Rate limited — please try again in a moment.");
    if (res.status === 402)
      throw new Error(message || "AI credits exhausted. Add credits to continue.");
    throw new Error(message || `AI request failed (${res.status})`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

const MessagesInput = z.object({
  system: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

export const runAIChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MessagesInput.parse(input))
  .handler(async ({ data }) => {
    const text = await callGateway([{ role: "system", content: data.system }, ...data.messages]);
    return { text };
  });

const EmailInput = z.object({
  recipient: z.string(),
  goal: z.string().min(1),
  tone: z.string(),
  keyPoints: z.string(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const text = await callGateway([
      {
        role: "system",
        content:
          "You are an expert business email writer. Write a ready-to-send email in markdown-free plain text. Start with a 'Subject:' line, then the body. Keep it tight and specific — no placeholder brackets unless truly unknown.",
      },
      {
        role: "user",
        content: `Recipient: ${data.recipient || "unspecified"}\nTone: ${data.tone}\nGoal / intent: ${data.goal}\nKey points:\n${data.keyPoints || "(none provided)"}`,
      },
    ]);
    return { text };
  });

const SummaryInput = z.object({
  title: z.string(),
  date: z.string(),
  transcript: z.string().min(1),
});

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SummaryInput.parse(input))
  .handler(async ({ data }) => {
    const text = await callGateway([
      {
        role: "system",
        content:
          "You summarize meeting notes. Reply with EXACTLY three sections in this order, using these literal headers on their own lines: '## SUMMARY', '## ACTIONS', '## DECISIONS'. Under SUMMARY write a short executive paragraph. Under ACTIONS and DECISIONS use '- ' bullet lines. No other text.",
      },
      {
        role: "user",
        content: `Meeting: ${data.title || "Untitled"}\nDate: ${data.date || "n/a"}\n\nNotes/transcript:\n${data.transcript}`,
      },
    ]);

    const section = (name: string) => {
      const re = new RegExp(`##\\s*${name}\\s*([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
      return (text.match(re)?.[1] ?? "").trim();
    };

    return {
      summary: section("SUMMARY") || text,
      actions: section("ACTIONS"),
      decisions: section("DECISIONS"),
    };
  });

const PlanInput = z.object({ goal: z.string().min(1) });

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanInput.parse(input))
  .handler(async ({ data }) => {
    const text = await callGateway([
      {
        role: "system",
        content:
          'You are a project planner. Return ONLY valid JSON (no code fences) of the shape {"tasks":[{"title":string,"priority":"High"|"Medium"|"Low","duration":string,"category":string,"status":"todo"|"doing"|"done"}]} with 6-12 ordered, concrete sub-tasks. status is always "todo". duration is a short human estimate like "2 days".',
      },
      { role: "user", content: `Goal: ${data.goal}` },
    ]);

    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = z
      .object({
        tasks: z.array(
          z.object({
            title: z.string(),
            priority: z.enum(["High", "Medium", "Low"]).catch("Medium"),
            duration: z.string().default(""),
            category: z.string().default("General"),
            status: z.enum(["todo", "doing", "done"]).catch("todo"),
          }),
        ),
      })
      .parse(JSON.parse(cleaned));

    return parsed;
  });
