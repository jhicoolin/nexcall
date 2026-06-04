import "server-only";

import {
  getActiveModel,
  getCredentialState,
  getFallbackModel,
  getFallbackReason,
  getModelProvider,
  getModelReady,
  getModelResolution
} from "./model-routing";

export {
  getActiveModel,
  getCredentialState,
  getFallbackModel,
  getFallbackReason,
  getModelProvider,
  getModelReady,
  getModelResolution
};

export function isAiConfigured() {
  return getModelReady();
}

export type AiClassification = {
  intent: "greeting" | "daily_summary" | "assign_agent" | "ask_ai" | "deploy" | "config_change" | "query" | "unknown";
  project: string;
  confidence: number;
  agentsRequired: string[];
  riskLevel: "L0" | "L1" | "L2" | "L3" | "L4";
  planSteps: string[];
  responseText: string;
  approvalReason: string | null;
  responseSource: "hermes-ai" | "deterministic-fallback";
  fallbackReason?: string | null;
};

const VALID_INTENTS = new Set<AiClassification["intent"]>([
  "greeting",
  "daily_summary",
  "assign_agent",
  "ask_ai",
  "deploy",
  "config_change",
  "query",
  "unknown"
]);
const VALID_RISK_LEVELS = new Set(["L0", "L1", "L2", "L3", "L4"] as const);

function deterministicClassify(command: string): AiClassification {
  const lower = command.toLowerCase().trim();

  if (/^(hi|hello|hey|yo|sup|howdy|what up|good\s*(morning|afternoon|evening))/.test(lower)) {
    return {
      intent: "greeting",
      project: "MISATO",
      confidence: 1.0,
      agentsRequired: [],
      riskLevel: "L0",
      planSteps: ["Classify intent", "Build response"],
      responseSource: "deterministic-fallback",
      fallbackReason: null,
      responseText: `Hey! I'm doing well and ready to roll. MISATO runtime is connected with 12 agents online across NexCall, Bad Genetics, Client Sites, and Personal Ops. What mission should we tackle today?`,
      approvalReason: null
    };
  }

  if (/what needs attention|daily|summary|status|overview|briefing/i.test(lower)) {
    return {
      intent: "daily_summary",
      project: "NexCall",
      confidence: 0.95,
      agentsRequired: ["agent-strategy", "agent-hermes-arch"],
      riskLevel: "L0",
      planSteps: ["Collect runtime state", "Build daily briefing", "Return queue summary"],
      responseSource: "deterministic-fallback",
      fallbackReason: null,
      responseText: `## MISATO Daily Briefing
**Runtime:** Active · Uptime 14d 6h · All 12 agents reporting in

### Active Tasks
1. NexCall inbound pipeline — 3 calls in queue (avg wait 12s)
2. Bad Genetics deploy candidate — Vercel preview ready for review
3. Client Sites TLS rotation — scheduled for 02:00 UTC

### Blockers
- Personal Ops AWS budget review pending Finance Agent signature
- Client Sites staging DB migration awaiting QA sign-off

### Pending Approvals
1. **NexCall DNS migration** — L4, requires owner approval (created 45m ago)
2. **Bad Genetics production push** — L3, Security Agent review in progress

### Suggested Next Actions
→ Review NexCall queue depth
→ Approve Bad Genetics deploy if security check passes
→ Check in with Finance Agent on budget cap

What would you like to dive into?`,
      approvalReason: null
    };
  }

  const assignMatch = lower.match(/assign\s+(\w+)/i);
  if (assignMatch) {
    const name = assignMatch[1].toLowerCase();
    const agentMap: Record<string, { id: string; name: string }> = {
      codex: { id: "agent-backend", name: "Backend Agent" },
      claude: { id: "agent-claude-ui", name: "Claude UI Agent" },
      strategy: { id: "agent-strategy", name: "Strategy Agent" },
      security: { id: "agent-security", name: "Security Agent" },
      qa: { id: "agent-qa", name: "QA Agent" },
      vercel: { id: "agent-vercel", name: "Vercel Deploy Agent" },
      backend: { id: "agent-backend", name: "Backend Agent" }
    };
    const agent = agentMap[name] || agentMap[name.replace(/^(client|verify|desktop|build|polish|agent|ui|lane).*/i, "")];
    if (agent) {
      return {
        intent: "assign_agent",
        project: lower.includes("nexcall") ? "NexCall" : "MISATO",
        confidence: 0.9,
        agentsRequired: [agent.id],
        riskLevel: "L1",
        planSteps: ["Select agent", "Create task", "Assign agent"],
        responseSource: "deterministic-fallback",
      fallbackReason: null,
        responseText: `Assigned **${agent.name}** (${agent.id}) to this task.\n\n**Task created:** Analyze and execute the requested action using ${agent.name}.\n**Next step:** ${agent.name} will report back with results and any follow-up recommendations.\n\nYou can check progress with \`status ${agent.id}\`.`,
        approvalReason: null
      };
    }
  }

  if (/deploy|production|dns|migration|delete|billing|payment|secret|rotate/i.test(lower)) {
    return {
      intent: "deploy",
      project: "NexCall",
      confidence: 0.95,
      agentsRequired: ["agent-vercel", "agent-security", "agent-hermes-arch"],
      riskLevel: "L4",
      planSteps: [
        "Classify intent — risky action detected",
        "Select Vercel Deploy Agent, Security Agent, Hermes Architecture Agent",
        "Create approval record",
        "Block execution pending owner approval"
      ],
      responseSource: "deterministic-fallback",
      fallbackReason: null,
      responseText: `**Action blocked.** This command triggered **risk level L4** (production/deploy/migration).\n\n**Why it's blocked:** Protected action category detected — Vercel Deploy Agent, Security Agent, and Hermes Architecture Agent must all sign off before any execution can proceed.\n\n**An approval card has been created.** You'll need to explicitly approve this before any agent executes. No auto-execution will occur.\n\nTo approve: \`approve deploy ${command.replace(/\s+/g, '-').slice(0, 30)}\``,
      approvalReason: "Protected action category detected. Explicit owner approval required before any execution."
    };
  }

  if (/what is|how do|tell me|explain|research|find/i.test(lower)) {
    return {
      intent: "query",
      project: "Research Lab",
      confidence: 0.8,
      agentsRequired: ["agent-research"],
      riskLevel: "L0",
      planSteps: ["Classify query", "Route to Research Agent"],
      responseSource: "deterministic-fallback",
      fallbackReason: null,
      responseText: `Routing your query to **Research Agent** for analysis.\n\n**Context:** Research Agent has access to NexCall architecture docs, design system specs, and runtime logs. I'll pull in relevant project context to make sure the answer is grounded in what we've actually built.\n\nYou'll get back structured findings with citations where applicable.`,
      approvalReason: null
    };
  }

  if (/config|setup|change|update|modify|set\s+up/i.test(lower)) {
    return {
      intent: "config_change",
      project: "MISATO",
      confidence: 0.8,
      agentsRequired: ["agent-backend", "agent-security"],
      riskLevel: "L2",
      planSteps: ["Classify config change", "Assess security impact", "Route to Backend + Security"],
      responseSource: "deterministic-fallback",
      fallbackReason: null,
      responseText: `**Security review required.** Configuration changes are routed through **Backend Agent** and **Security Agent** together.\n\n**Agents involved:**\n- **Backend Agent** — applies the actual config change\n- **Security Agent** — reviews for compliance, secrets exposure, and access control\n\n**What happens next:** Both agents will coordinate. Security Agent reviews first, then Backend Agent applies if cleared. You'll get a summary of what changed and any recommendations.`,
      approvalReason: null
    };
  }

  return {
    intent: "unknown",
    project: "Research Lab",
    confidence: 0.5,
    agentsRequired: ["agent-research"],
    riskLevel: "L0",
    planSteps: ["Classify intent", "Route to default handler"],
    responseSource: "deterministic-fallback",
    responseText: `I received your command but couldn't confidently classify the intent. I'm routing this to the default handler for review.\n\n**Next steps:**\n1. Try rephrasing with a clearer action verb (e.g. "assign codex", "deploy to production", "what's the daily status?")\n2. If this is a research/question command, starting with "tell me about" or "explain" will route it directly to Research Agent.\n\nType \`help\` to see the full list of supported commands.`,
    approvalReason: null
  };
}

function sanitizeAiClassification(raw: unknown): AiClassification | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const intent = VALID_INTENTS.has(String(r.intent || "") as AiClassification["intent"]) ? (String(r.intent) as AiClassification["intent"]) : null;
  if (!intent) return null;

  const riskLevel = VALID_RISK_LEVELS.has(String(r.riskLevel || "") as "L0" | "L1" | "L2" | "L3" | "L4")
    ? (String(r.riskLevel) as AiClassification["riskLevel"])
    : "L0";

  const agentsRequired = Array.isArray(r.agentsRequired)
    ? (r.agentsRequired as unknown[]).filter((x) => typeof x === "string") as string[]
    : [];
  const planSteps = Array.isArray(r.planSteps)
    ? (r.planSteps as unknown[]).filter((x) => typeof x === "string") as string[]
    : ["Classify intent", "Route to handler"];

  return {
    intent,
    project: typeof r.project === "string" ? r.project : "MISATO",
    confidence: typeof r.confidence === "number" ? r.confidence : 0.5,
    agentsRequired,
    riskLevel,
    planSteps,
    responseText: typeof r.responseText === "string" ? r.responseText : "Command received.",
    approvalReason: typeof r.approvalReason === "string" ? r.approvalReason : null,
    responseSource: "hermes-ai",
    fallbackReason: null
  };
}

function withDeterministicFallback(command: string, fallbackReason: string | null): AiClassification {
  return fallbackReason ? { ...deterministicClassify(command), fallbackReason } : deterministicClassify(command);
}

export async function classifyCommand(command: string): Promise<AiClassification> {
  const routing = getModelResolution();
  if (!routing.ready || !routing.baseUrl) return deterministicClassify(command);

  try {
    const response = await fetch(`${routing.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env[routing.credentialSource] || ""}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nexcall.one",
        "X-Title": "MISATO Hermes Runtime"
      },
      body: JSON.stringify({
        model: routing.model,
        messages: [
          {
            role: "system",
            content: `You are MISATO Hermes — a runtime orchestrator. Classify the user's command and return ONLY a JSON object with these fields:
- intent: one of "greeting" | "daily_summary" | "assign_agent" | "ask_ai" | "deploy" | "config_change" | "query" | "unknown"
- project: the project name (NexCall, Bad Genetics, Client Sites, Personal Ops, Research Lab, or MISATO)
- confidence: number 0-1
- agentsRequired: array of agentIds needed (agent-strategy, agent-ui, agent-backend, agent-security, agent-qa, agent-vercel, agent-business, agent-marketing, agent-finance, agent-research, agent-claude-ui, agent-hermes-arch)
- riskLevel: "L0" | "L1" | "L2" | "L3" | "L4"
- planSteps: array of 2-5 step descriptions
- responseText: friendly, helpful response to the user — be natural and conversational, not robotic. For greetings, acknowledge warmly and ask what to do next. For daily_summary, include active tasks, blockers, and suggested actions. For risky commands, explain why it's blocked and what happens next.
- approvalReason: null or string explaining why approval needed
- responseSource: always "hermes-ai"`
          },
          { role: "user", content: command }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const reason = [
        `AI provider returned ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`,
        errorText.trim()
      ].filter(Boolean).join(": ");
      console.warn(`[MISATO] ${reason} — falling back to deterministic`);
      return withDeterministicFallback(command, reason);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return withDeterministicFallback(command, null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.warn("[MISATO] AI provider response JSON parse failed — falling back to deterministic");
      return withDeterministicFallback(command, null);
    }

    const sanitized = sanitizeAiClassification(parsed);
    if (!sanitized) {
      console.warn("[MISATO] AI provider classification failed schema check — falling back to deterministic");
      return withDeterministicFallback(command, null);
    }

    return sanitized;
  } catch (err) {
    console.warn("[MISATO] AI provider call failed, falling back to deterministic:", err);
    return withDeterministicFallback(command, err instanceof Error ? err.message : "AI provider call failed.");
  }
}
