/**
 * Product-level API surface for the AI Customer Care backend.
 * Components call these instead of touching `http`/URLs directly.
 */
import { http } from "@/lib/http"
import type { CreateEventResponse, EventRecord, TicketPayload } from "@/lib/workflow"

export const api = {
  /** Submit a ticket; the backend queues it for async workflow processing. */
  createEvent: (payload: TicketPayload) =>
    http.post<CreateEventResponse>("/events", payload),

  /** Fetch one event; `task_context` is null until the workflow finishes. */
  getEvent: (eventId: string, options?: { signal?: AbortSignal }) =>
    http.get<EventRecord>(`/events/${eventId}`, options),

  health: () => http.get<{ status: string }>("/health"),
}
