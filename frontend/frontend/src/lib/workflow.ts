/**
 * Domain types and parsing for the AI Customer Care backend.
 *
 * The backend persists a `task_context` JSON blob on each event once the Celery
 * workflow finishes. Its `nodes` map is dynamic (only the nodes that actually
 * ran are present), so we narrow it into a flat, strongly-typed `WorkflowResult`
 * at this boundary instead of letting `unknown` leak into the UI.
 */

export const SUPPORT_EMAIL = "service.clientele@sncf-connect.com"

export type Intent =
  | "general/question"
  | "product/question"
  | "billing/invoice"
  | "refund/request"

export type RouteTarget =
  | "GenerateResponseNode"
  | "EscalateTicketNode"
  | "ProcessInvoiceNode"
  | "CloseTicketNode"

export type Outcome = "replied" | "escalated" | "invoice" | "closed"

export interface TicketPayload {
  from_email: string
  to_email: string
  sender: string
  subject: string
  body: string
}

export interface CreateEventResponse {
  event_id: string
  ticket_id: string
}

export interface EventRecord {
  id: string
  workflow_type: string
  data: Record<string, unknown>
  task_context: Record<string, unknown> | null
  created_at: string | null
}

export interface IntentAnalysis {
  reasoning: string
  intent: Intent
  confidence: number
  escalate: boolean
}

export interface SpamAnalysis {
  reasoning: string
  confidence: number
  isHuman: boolean
}

export interface ValidationAnalysis {
  reasoning: string
  confidence: number
  isActionable: boolean
}

export interface RetrievedDoc {
  title: string | null
  source: string | null
  type: string | null
  similarity: number
  /** Reciprocal Rank Fusion score from hybrid retrieval (null if unavailable). */
  score: number | null
  /** The retrieved chunk text used as grounding context. */
  content: string
}

export interface WorkflowResult {
  intent: IntentAnalysis
  spam: SpamAnalysis
  validation: ValidationAnalysis
  route: RouteTarget
  outcome: Outcome
  /** The generated French reply, present only when the ticket was answered. */
  response: string | null
  responseReasoning: string | null
  responseConfidence: number | null
  retrievedDocs: RetrievedDoc[]
}

// ---------------------------------------------------------------------------
// Display labels (French — to match the backend, which always responds in FR)
// ---------------------------------------------------------------------------

export const INTENT_LABELS: Record<Intent, string> = {
  "general/question": "Question générale",
  "product/question": "Question produit",
  "billing/invoice": "Facturation",
  "refund/request": "Remboursement",
}

export const DOC_TYPE_LABELS: Record<string, string> = {
  knowledge_base: "Base de connaissances",
  resolved_ticket: "Ticket résolu",
  policy: "Politique",
  document: "Document",
}

export const OUTCOME_LABELS: Record<Outcome, { title: string; description: string }> = {
  replied: {
    title: "Réponse automatique",
    description: "L'assistant a rédigé une réponse automatiquement.",
  },
  escalated: {
    title: "Transmis à un agent",
    description: "Cas sensible : le ticket a été escaladé à un conseiller humain.",
  },
  invoice: {
    title: "Service facturation",
    description: "Le ticket a été dirigé vers l'équipe facturation.",
  },
  closed: {
    title: "Ticket fermé",
    description: "Message classé comme indésirable ou non recevable.",
  },
}

export function docTypeLabel(type: string | null): string {
  if (!type) return "Document"
  return DOC_TYPE_LABELS[type] ?? type
}

const ROUTE_TO_OUTCOME: Record<RouteTarget, Outcome> = {
  GenerateResponseNode: "replied",
  EscalateTicketNode: "escalated",
  ProcessInvoiceNode: "invoice",
  CloseTicketNode: "closed",
}

// ---------------------------------------------------------------------------
// Parsing helpers — narrow `unknown` JSON into typed values, defensively.
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function asBoolean(value: unknown): boolean {
  return value === true
}

function nodeOutput(nodes: Record<string, unknown>, nodeName: string): Record<string, unknown> {
  return asRecord(asRecord(nodes[nodeName]).output)
}

const KNOWN_INTENTS: readonly Intent[] = [
  "general/question",
  "product/question",
  "billing/invoice",
  "refund/request",
]

function asIntent(value: unknown): Intent {
  return KNOWN_INTENTS.includes(value as Intent) ? (value as Intent) : "general/question"
}

const KNOWN_ROUTES: readonly RouteTarget[] = [
  "GenerateResponseNode",
  "EscalateTicketNode",
  "ProcessInvoiceNode",
  "CloseTicketNode",
]

function asRoute(value: unknown): RouteTarget {
  return KNOWN_ROUTES.includes(value as RouteTarget)
    ? (value as RouteTarget)
    : "GenerateResponseNode"
}

/** Convert a persisted `task_context` blob into a typed `WorkflowResult`. */
export function parseTaskContext(taskContext: Record<string, unknown>): WorkflowResult {
  const nodes = asRecord(taskContext.nodes)

  const intentOut = nodeOutput(nodes, "DetermineTicketIntentNode")
  const spamOut = nodeOutput(nodes, "FilterSpamNode")
  const validationOut = nodeOutput(nodes, "ValidateTicketNode")

  const route = asRoute(asRecord(nodes.TicketRouterNode).next_node)
  const outcome = ROUTE_TO_OUTCOME[route]

  const generate = asRecord(nodes.GenerateResponseNode)
  const generateOut = asRecord(generate.output)
  const sendReply = asRecord(nodes.SendReplyNode)

  const rawDocs = Array.isArray(generate.retrieved_docs) ? generate.retrieved_docs : []
  const retrievedDocs: RetrievedDoc[] = rawDocs.map((raw) => {
    const doc = asRecord(raw)
    return {
      title: typeof doc.title === "string" ? doc.title : null,
      source: typeof doc.source === "string" ? doc.source : null,
      type: typeof doc.type === "string" ? doc.type : null,
      similarity: asNumber(doc.similarity),
      score: typeof doc.score === "number" ? doc.score : null,
      content: typeof doc.content === "string" ? doc.content : "",
    }
  })

  const response =
    asString(sendReply.response) || asString(generateOut.response) || null

  return {
    intent: {
      reasoning: asString(intentOut.reasoning),
      intent: asIntent(intentOut.intent),
      confidence: asNumber(intentOut.confidence),
      escalate: asBoolean(intentOut.escalate),
    },
    spam: {
      reasoning: asString(spamOut.reasoning),
      confidence: asNumber(spamOut.confidence),
      isHuman: asBoolean(spamOut.is_human),
    },
    validation: {
      reasoning: asString(validationOut.reasoning),
      confidence: asNumber(validationOut.confidence),
      isActionable: asBoolean(validationOut.is_actionable),
    },
    route,
    outcome,
    response: outcome === "replied" ? response : null,
    responseReasoning: outcome === "replied" ? asString(generateOut.reasoning) || null : null,
    responseConfidence:
      outcome === "replied" && typeof generateOut.confidence === "number"
        ? generateOut.confidence
        : null,
    retrievedDocs,
  }
}

/** Build a ticket subject from the message: first line, trimmed to a sane length. */
export function deriveSubject(body: string): string {
  const firstLine = body.split("\n")[0]?.trim() ?? ""
  const subject = firstLine.length > 0 ? firstLine : body.trim()
  if (subject.length <= 80) return subject
  return subject.slice(0, 77).trimEnd() + "…"
}
