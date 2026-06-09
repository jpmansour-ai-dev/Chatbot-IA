import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme !== "light"

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Changer de thème"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? "Clair" : "Sombre"}
    </Button>
  )
}
