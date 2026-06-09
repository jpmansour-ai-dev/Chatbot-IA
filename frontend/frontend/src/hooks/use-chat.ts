import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

import { api } from "@/lib/api"
import { ApiError } from "@/lib/http"
import {
  deriveSubject,
  parseTaskContext,
  SUPPORT_EMAIL,
  type WorkflowResult,
} from "@/lib/workflow"

export interface Identity {
  name: string
  email: string
}

export interface Turn {
  id: string
  sender: string
  subject: string
  body: string
  createdAt: number
  status: "processing" | "done" | "error"
  result?: WorkflowResult
  error?: string
}

const POLL_INTERVAL_MS = 1_200
const POLL_TIMEOUT_MS = 180_000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function pollResult(eventId: string): Promise<WorkflowResult> {
  const start = Date.now()
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const event = await api.getEvent(eventId)
    if (event.task_context) return parseTaskContext(event.task_context)
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error("timeout")
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message === "timeout") {
    return "Le traitement a pris trop de temps. Le worker est-il bien démarré ?"
  }
  return "Une erreur inattendue s'est produite."
}

/** Manages the chat turns plus the submit → poll → render lifecycle. */
export function useChat(identity: Identity) {
  const [turns, setTurns] = useState<Turn[]>([])
  // Keep the latest identity available to the async submit closure.
  const identityRef = useRef(identity)
  identityRef.current = identity

  const patchTurn = useCallback((id: string, patch: Partial<Turn>) => {
    setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)))
  }, [])

  const submit = useCallback(
    async (rawBody: string) => {
      const body = rawBody.trim()
      if (body.length === 0) return

      const { name, email } = identityRef.current
      const id = crypto.randomUUID()
      const subject = deriveSubject(body)

      setTurns((prev) => [
        ...prev,
        { id, sender: name, subject, body, createdAt: Date.now(), status: "processing" },
      ])

      try {
        const { event_id } = await api.createEvent({
          from_email: email,
          to_email: SUPPORT_EMAIL,
          sender: name,
          subject,
          body,
        })
        const result = await pollResult(event_id)
        patchTurn(id, { status: "done", result })
      } catch (error) {
        const message = errorMessage(error)
        patchTurn(id, { status: "error", error: message })
        toast.error(message)
      }
    },
    [patchTurn],
  )

  const isBusy = turns.some((turn) => turn.status === "processing")

  return { turns, submit, isBusy }
}
