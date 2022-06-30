import DarkTheme from './DarkTheme'
import LightTheme from './LightTheme'

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  docs: {
    theme: DarkTheme
  },
  darkMode: {
    current: 'dark',
    dark: DarkTheme,
    light: LightTheme
  },
  backgrounds: {
    disable: true,
    grid: {
      disable: true
    }
  }
}
