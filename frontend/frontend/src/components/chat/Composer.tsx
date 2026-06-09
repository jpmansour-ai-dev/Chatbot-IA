import { type KeyboardEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ComposerProps {
  onSubmit: (text: string) => void
  disabled?: boolean
}

export function Composer({ onSubmit, disabled }: ComposerProps) {
  const [text, setText] = useState("")
  const canSend = !disabled && text.trim().length > 0

  function send() {
    if (!canSend) return
    onSubmit(text)
    setText("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/40">
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Décrivez votre demande… (Entrée pour envoyer, Maj+Entrée pour un saut de ligne)"
        className="max-h-40 min-h-0 resize-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <Button className="rounded-xl" onClick={send} disabled={!canSend}>
        Envoyer
      </Button>
    </div>
  )
}
