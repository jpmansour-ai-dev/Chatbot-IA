import { ProcessingIndicator } from "@/components/chat/ProcessingIndicator"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useTypewriter } from "@/hooks/use-typewriter"
import type { Turn } from "@/hooks/use-chat"
import { type RetrievedDoc, type WorkflowResult } from "@/lib/workflow"

const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" })

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?"
}

/** One short sentence describing what the assistant decided for this ticket. */
function decisionSentence(result: WorkflowResult): string {
  switch (result.outcome) {
    case "replied":
      return "Réponse générée par l'IA en se basant sur la base de connaissances."
    case "escalated":
      return "Demande escaladée à un conseiller humain."
    case "invoice":
      return "Demande transférée au service de facturation."
    case "closed":
      return result.spam.isHuman
        ? "L'IA a jugé ce message non recevable."
        : "L'IA a classifié ce message comme spam."
  }
}

function Decision({ result }: { result: WorkflowResult }) {
  return (
    <div className="rounded-lg border bg-card/40 p-3">
      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        Décision de l'assistant IA
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{decisionSentence(result)}</p>
    </div>
  )
}

/** Label for a source: the full URL, or the file name for a local PDF/path. */
function sourceLabel(source: string | null): string {
  if (!source) return "Document"
  if (source.startsWith("http")) return source
  const parts = source.split(/[/\\]/)
  return parts[parts.length - 1] || source
}

/** The single retrieved passage with the highest semantic similarity. */
function topBySimilarity(docs: RetrievedDoc[]): RetrievedDoc | null {
  if (docs.length === 0) return null
  return docs.reduce((best, doc) => (doc.similarity > best.similarity ? doc : best))
}

/** Shows the best-matching knowledge-base passage: its source + chunk. */
function Source({ doc }: { doc: RetrievedDoc }) {
  const isUrl = doc.source?.startsWith("http") ?? false
  const pct = Math.round(Math.min(1, Math.max(0, doc.similarity)) * 100)

  return (
    <div className="rounded-lg border bg-card/40 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Source
        </span>
        <span className="text-[11px] text-muted-foreground">similarité {pct}%</span>
      </div>
      {isUrl && doc.source ? (
        <a
          href={doc.source}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-xs font-medium text-primary hover:underline"
        >
          {doc.source}
        </a>
      ) : (
        <p className="mt-1 truncate text-xs font-medium text-foreground">{sourceLabel(doc.source)}</p>
      )}
      {doc.content && (
        <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
          {doc.content}
        </p>
      )}
    </div>
  )
}

function AssistantResult({ result }: { result: WorkflowResult }) {
  const { response, retrievedDocs } = result
  // Reveal the reply word by word; non-replied outcomes have no text to stream.
  const { shown, done } = useTypewriter(response ?? "", response !== null)
  const topDoc = topBySimilarity(retrievedDocs)

  return (
    <div className="space-y-3">
      {response !== null && (
        <p className="text-sm leading-relaxed whitespace-pre-line">{shown}</p>
      )}
      {(response === null || done) && (
        <>
          {topDoc && <Source doc={topDoc} />}
          {response !== null && <Separator />}
          <Decision result={result} />
        </>
      )}
    </div>
  )
}

export function TurnView({ turn }: { turn: Turn }) {
  return (
    <div className="space-y-3">
      {/* Customer message */}
      <div className="flex justify-end gap-2.5">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-line">{turn.body}</p>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {initials(turn.sender)}
        </div>
      </div>
      <div className="flex justify-end">
        <span className="mr-[42px] text-[11px] text-muted-foreground">
          {turn.sender} · {timeFormatter.format(new Date(turn.createdAt))}
        </span>
      </div>

      {/* Assistant response */}
      <div className="flex gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          IA
        </div>
        <Card className="min-w-0 flex-1 gap-0 overflow-hidden py-0">
          <div className="space-y-4 p-4">
            {turn.status === "processing" && <ProcessingIndicator />}
            {turn.status === "error" && (
              <p className="text-sm text-rose-500">
                {turn.error ?? "Une erreur s'est produite."}
              </p>
            )}
            {turn.status === "done" && turn.result && <AssistantResult result={turn.result} />}
          </div>
        </Card>
      </div>
    </div>
  )
}
