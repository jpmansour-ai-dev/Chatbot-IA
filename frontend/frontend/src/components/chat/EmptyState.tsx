interface Suggestion {
  label: string
  body: string
}

const SUGGESTIONS: Suggestion[] = [
  {
    label: "Échanger ou annuler",
    body:
      "Bonjour, j'ai réservé un billet TGV INOUI Paris–Lyon pour le 20 juin. " +
      "Jusqu'à quand puis-je l'échanger ou l'annuler, est-ce qu'il y a des frais, " +
      "et serai-je remboursé si j'annule ?",
  },
  {
    label: "Retard de mon train",
    body:
      "Bonjour, mon TGV est arrivé hier avec 1h30 de retard et j'ai manqué ma correspondance. " +
      "Ai-je droit à une compensation, et comment puis-je la demander ?",
  },
  {
    label: "Facture de mon billet",
    body:
      "Bonjour, je n'arrive pas à télécharger la facture de mon trajet du 28 mai depuis mon compte. " +
      "Pouvez-vous m'envoyer le justificatif correspondant ?",
  },
]

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Comment pouvons-nous vous aider ?</h1>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        Décrivez votre demande. Notre assistant l'analyse, la classe et y répond automatiquement —
        ou la transmet à un conseiller si nécessaire.
      </p>
      <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-3">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onPick(suggestion.body)}
            className="rounded-xl border bg-card/40 p-3 text-left text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  )
}
