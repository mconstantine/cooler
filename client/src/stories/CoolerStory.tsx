import { PropsWithChildren, useEffect } from 'react'
import { useDarkMode } from 'storybook-dark-mode'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import { Cooler } from '../components/Cooler/Cooler'

function CoolerStoryThemeConsumer(props: PropsWithChildren<{}>) {
  const isDarkMode = useDarkMode()
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme(isDarkMode ? 'dark' : 'light')
  }, [isDarkMode, setTheme])

  return <Cooler>{props.children}</Cooler>
}

export function CoolerStory(props: PropsWithChildren<{}>) {
  return (
    <ThemeProvider>
      <CoolerStoryThemeConsumer>{props.children}</CoolerStoryThemeConsumer>
    </ThemeProvider>
  )
}
