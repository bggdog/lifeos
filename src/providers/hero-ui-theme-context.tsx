import { useTheme } from '@heroui/react'
import { createContext } from 'react'

export type HeroUIThemeContextValue = ReturnType<typeof useTheme>

export const HeroUIThemeContext = createContext<HeroUIThemeContextValue | null>(
  null,
)
