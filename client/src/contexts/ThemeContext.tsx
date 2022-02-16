import { option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState
} from 'react'
import { useStorage } from '../effects/useStorage'
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
  const { readStorage, writeStorage } = useStorage()

  const [theme, setTheme] = useState<Theme>(
    pipe(
      readStorage('theme'),
      option.getOrElse<Theme>(() => 'dark')
    )
  )

  useEffect(() => {
    window.document.body.classList.remove('dark', 'light')
    window.document.body.classList.add(theme)
    writeStorage('theme', theme)
  }, [theme, writeStorage])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContext {
  return useContext(ThemeContext)
}
