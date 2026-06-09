import { IdentityPopover } from "@/components/chat/IdentityPopover"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Identity } from "@/hooks/use-chat"

interface ChatHeaderProps {
  identity: Identity
  onIdentityChange: (identity: Identity) => void
}

export function ChatHeader({ identity, onIdentityChange }: ChatHeaderProps) {
  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="leading-tight">
          <p className="text-sm font-semibold">SNCF Connect</p>
          <p className="text-xs text-muted-foreground">Assistance client · IA</p>
        </div>
        <div className="flex items-center gap-2">
          <IdentityPopover identity={identity} onChange={onIdentityChange} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
