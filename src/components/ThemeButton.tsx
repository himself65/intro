'use client'

import { useTheme } from 'next-themes'
import { useIsClient } from 'foxact/use-is-client'

export const ThemeButton = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const isClient = useIsClient()
  const text = isClient && resolvedTheme === 'dark' ? (
    '🌞'
  ) : (
    '🌙'
  )
  return (
    <button
      className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {text}
    </button>
  )
}
