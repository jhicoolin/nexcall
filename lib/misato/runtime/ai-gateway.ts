/** AI Gateway — lightweight OpenRouter/Vercel AI Gateway client */

const GATEWAY_BASE = "https://openrouter.ai/api/v1";
const GATEWAY_MODEL = process.env.AI_GATEWAY_MODEL || "deepseek/deepseek-v4-flash";

function getApiKey(): string | null {
  return process.env.AI_GATEWAY_API_KEY || null;
}

export function getActiveModel() {
  return getApiKey() ? GATEWAY_MODEL : "deterministic-fallback";
}

export function getFallbackModel() {
  return "deterministic-fallback";
}

export function isAiConfigured() {
  return !!getApiKey();
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
};

function deterministicClassify(command: string): AiClassification {
  const lower = command.toLowerCase().trim();
  
  // Greeting
  if (/^(hi|hello|hey|yo|sup|howdy|what up|good\s*(morning|afternoon|evening))/.test(lower)) {
    return {
      intent: "greeting",
      project: "MISATO",
      confidence: 1.0,
      agentsRequired: [],
      riskLevel: "L0",
      planSteps: ["Classify intent", "Build response"],
      responseText: "MISATO is online. Hermes is connected. What do you want to run?",
      approvalReason: null
    };
  }

  // Daily attention
  if (/what needs attention|daily|summary|status|overview/i.test(lower)) {
    return {
      intent: "daily_summary",
      project: "NexCall",
      confidence: 0.95,
      agentsRequired: ["agent-strategy", "agent-hermes-arch"],
      riskLevel: "L0",
      planSteps: ["Collect runtime state", "Build daily briefing", "Return queue summary"],
      responseText: "Compiling daily operations overview...",
      approvalReason: null
    };
  }

  // Assign Codex / agent
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
        responseText: `Assigning ${agent.name}...`,
        approvalReason: null
      };
    }
  }

  // Deploy / production risk
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
      responseText: "Deploy commands require explicit owner approval. Creating approval card now.",
      approvalReason: "Protected action category detected. Explicit owner approval required before any execution."
    };
  }

  // Query / research
  if (/what is|how do|tell me|explain|research|find/i.test(lower)) {
    return {
      intent: "query",
      project: "Research Lab",
      confidence: 0.8,
      agentsRequired: ["agent-research"],
      riskLevel: "L0",
      planSteps: ["Classify query", "Route to Research Agent"],
      responseText: "Routing query to Research Agent...",
      approvalReason: null
    };
  }

  // Config change
  if (/config|setup|change|update|modify|set\s+up/i.test(lower)) {
    return {
      intent: "config_change",
      project: "MISATO",
      confidence: 0.8,
      agentsRequired: ["agent-backend", "agent-security"],
      riskLevel: "L2",
      planSteps: ["Classify config change", "Assess security impact", "Route to Backend + Security"],
      responseText: "Config changes require Security Agent review...",
      approvalReason: null
    };
  }

  // Default
  return {
    intent: "unknown",
    project: "Research Lab",
    confidence: 0.5,
    agentsRequired: ["agent-research"],
    riskLevel: "L0",
    planSteps: ["Classify intent", "Route to default handler"],
    responseText: "Command received. Classifying intent...",
    approvalReason: null
  };
}

export async function classifyCommand(command: string): Promise<AiClassification> {
  const key = getApiKey();
  if (!key) return deterministicClassify(command);

  try {
    const response = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nexcall.one",
        "X-Title": "MISATO Hermes Runtime"
      },
      body: JSON.stringify({
        model: GATEWAY_MODEL,
        messages: [
          { role: "system", content: `You are MISATO Hermes — a runtime orchestrator. Classify the user's command and return ONLY a JSON object with these fields:
- intent: one of "greeting" | "daily_summary" | "assign_agent" | "ask_ai" | "deploy" | "config_change" | "query" | "unknown"
- project: the project name (NexCall, Bad Genetics, Client Sites, Personal Ops, Research Lab, or MISATO)
- confidence: number 0-1
- agentsRequired: array of agentIds needed (agent-strategy, agent-ui, agent-backend, agent-security, agent-qa, agent-vercel, agent-business, agent-marketing, agent-finance, agent-research, agent-claude-ui, agent-hermes-arch)
- riskLevel: "L0" | "L1" | "L2" | "L3" | "L4"
- planSteps: array of 2-5 step descriptions
- responseText: brief response to user
- approvalReason: null or string explaining why approval needed` },
          { role: "user", content: command }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.warn(`AI gateway returned ${response.status}, falling back to deterministic`);
      return deterministicClassify(command);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AiClassification;
    }

    return deterministicClassify(command);
  } catch (err) {
    console.warn("AI gateway call failed, falling back to deterministic:", err);
    return deterministicClassify(command);
  }
}