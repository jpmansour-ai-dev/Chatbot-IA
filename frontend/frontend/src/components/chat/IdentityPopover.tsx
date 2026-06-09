import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Identity } from "@/hooks/use-chat"

interface IdentityPopoverProps {
  identity: Identity
  onChange: (identity: Identity) => void
}

export function IdentityPopover({ identity, onChange }: IdentityPopoverProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(identity)

  function save() {
    const next: Identity = {
      name: draft.name.trim() || identity.name,
      email: draft.email.trim() || identity.email,
    }
    onChange(next)
    setDraft(next)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setDraft(identity)
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="max-w-32 truncate">{identity.name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Votre identité</p>
            <p className="text-xs text-muted-foreground">
              Utilisée comme expéditeur du ticket envoyé au backend.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="identity-name">
              Nom
            </label>
            <Input
              id="identity-name"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Jean-Pierre Mansour"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="identity-email">
              Email
            </label>
            <Input
              id="identity-email"
              type="email"
              value={draft.email}
              onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="jeanpierre01mansour@gmail.com"
            />
          </div>
          <Button size="sm" className="w-full" onClick={save}>
            Enregistrer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
