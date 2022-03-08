import { constVoid } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState
} from 'react'
import * as t from 'io-ts'

export const Theme = t.keyof(
  {
    light: true,
    dark: true
  },
  'Theme'
)
export type Theme = t.TypeOf<typeof Theme>

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

export function ThemeProvider(props: PropsWithChildren<{}>) {
  const [theme, setTheme] = useState<Theme>(
    window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  )

  useEffect(() => {
    const onPreferredColorSchemeChange: Reader<
      MediaQueryListEvent,
      void
    > = e => {
      const newTheme: Theme = e.matches ? 'dark' : 'light'
      setTheme(newTheme)
    }

    window.matchMedia &&
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', onPreferredColorSchemeChange)

    return () => {
      window.matchMedia &&
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .removeEventListener('change', onPreferredColorSchemeChange)
    }
  }, [])

  useEffect(() => {
    window.document.body.classList.remove('dark', 'light')
    window.document.body.classList.add(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContext {
  return useContext(ThemeContext)
}
