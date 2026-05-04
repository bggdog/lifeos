import { useContext } from 'react'
import type { HeroUIThemeContextValue } from '../providers/hero-ui-theme-context'
import { HeroUIThemeContext } from '../providers/hero-ui-theme-context'

export function useHeroUITheme(): HeroUIThemeContextValue {
  const ctx = useContext(HeroUIThemeContext)
  if (!ctx) {
    throw new Error('useHeroUITheme must be used within HeroUIProvider')
  }
  return ctx
}
