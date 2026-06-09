/** Lightweight "in progress" text shown while the backend workflow runs. */
export function ProcessingIndicator() {
  return (
    <p className="animate-pulse py-1 text-sm text-muted-foreground">
      Chargement de la réponse…
    </p>
  )
}
