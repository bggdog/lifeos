import { useTheme } from '@heroui/react'
import type { ReactNode } from 'react'
import { HeroUIThemeContext } from './hero-ui-theme-context'

/**
 * HeroUI v3 does not export `HeroUIProvider`; theming is CSS-first with `useTheme` for toggling.
 * This root wrapper keeps a single `useTheme` instance for the tree.
 */
export function HeroUIProvider({ children }: { children: ReactNode }) {
  const themeApi = useTheme('light')

  return (
    <HeroUIThemeContext.Provider value={themeApi}>
      {children}
    </HeroUIThemeContext.Provider>
  )
}
