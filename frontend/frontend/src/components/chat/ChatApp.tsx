import { useEffect, useRef } from "react"

import { ChatHeader } from "@/components/chat/ChatHeader"
import { Composer } from "@/components/chat/Composer"
import { EmptyState } from "@/components/chat/EmptyState"
import { TurnView } from "@/components/chat/TurnView"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Identity, useChat } from "@/hooks/use-chat"
import { useLocalStorage } from "@/hooks/use-local-storage"

const DEFAULT_IDENTITY: Identity = {
  name: "Jean-Pierre Mansour",
  email: "jeanpierre01mansour@gmail.com",
}

export function ChatApp() {
  const [identity, setIdentity] = useLocalStorage<Identity>("sncf-connect.identity", DEFAULT_IDENTITY)
  const { turns, submit, isBusy } = useChat(identity)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [turns])

  return (
    <div className="flex h-dvh flex-col bg-background">
      <ChatHeader identity={identity} onIdentityChange={setIdentity} />

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {turns.length === 0 ? (
            <EmptyState onPick={submit} />
          ) : (
            <div className="space-y-8">
              {turns.map((turn) => (
                <TurnView key={turn.id} turn={turn} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <Composer onSubmit={submit} disabled={isBusy} />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Démonstration locale · réponses générées par IA.
          </p>
        </div>
      </div>
    </div>
  )
}
