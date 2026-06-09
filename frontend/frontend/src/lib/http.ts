/**
 * Thin wrapper around the native `fetch` API.
 *
 * Responsibilities: apply the backend base URL, send/parse JSON, enforce a
 * timeout, and convert every failure into a typed `ApiError`. The `isNetworkError`
 * flag distinguishes CORS/connection failures (backend down) from HTTP errors
 * (backend reachable but returned a non-2xx status), so the UI can explain each
 * case differently.
 */
import { env } from "@/lib/env"

export class ApiError extends Error {
  readonly status: number | null
  readonly isNetworkError: boolean
  readonly body: unknown

  constructor(
    message: string,
    options: { status?: number | null; isNetworkError?: boolean; body?: unknown } = {},
  ) {
    super(message)
    this.name = "ApiError"
    this.status = options.status ?? null
    this.isNetworkError = options.isNetworkError ?? false
    this.body = options.body ?? null
  }
}

interface RequestOptions {
  /** Abort the request after this many milliseconds. Defaults to 15s. */
  timeoutMs?: number
  /** Caller-supplied signal, merged with the internal timeout signal. */
  signal?: AbortSignal
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { timeoutMs = 15_000, signal } = options
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  // Forward an externally requested abort to our controller.
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener("abort", () => controller.abort(), { once: true })
  }

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (cause) {
    if (controller.signal.aborted) {
      throw new ApiError("La requête a expiré.", { isNetworkError: true, body: cause })
    }
    // fetch only rejects on network-level failures (DNS, CORS, refused connection).
    throw new ApiError(
      "Impossible de joindre le backend. Vérifiez qu'il est démarré sur " + env.apiBaseUrl + ".",
      { isNetworkError: true, body: cause },
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new ApiError(`Le backend a renvoyé une erreur ${response.status}.`, {
      status: response.status,
      body: errorBody,
    })
  }

  return (await response.json()) as T
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
}
