import { constVoid } from 'fp-ts/lib/function'
import { Reader } from 'fp-ts/Reader'
import { createContext, FC, useContext, useState } from 'react'

type Theme = 'light' | 'dark'

export function foldTheme<T>(
  whenLight: () => T,
  whenDark: () => T
): (theme: Theme) => T {
  return theme => {
    switch (theme) {
      case 'light':
        return whenLight()
      case 'dark':
        return whenDark()
    }
  }
}

interface ThemeContext {
  theme: Theme
  setTheme: Reader<Theme, void>
}

const ThemeContext = createContext<ThemeContext>({
  theme: 'dark',
  setTheme: constVoid
})

export const ThemeProvider: FC = props => {
  const [theme, setTheme] = useState<Theme>('dark')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContext {
  return useContext(ThemeContext)
}
