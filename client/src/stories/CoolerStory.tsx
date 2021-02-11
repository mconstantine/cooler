import { FC, useEffect } from 'react'
import { useDarkMode } from 'storybook-dark-mode'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import { Cooler } from '../components/Cooler/Cooler'

const CoolerStoryThemeConsumer: FC = props => {
  const isDarkMode = useDarkMode()
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme(isDarkMode ? 'dark' : 'light')
  }, [isDarkMode, setTheme])

  return <Cooler>{props.children}</Cooler>
}

export const CoolerStory: FC = props => {
  return (
    <ThemeProvider>
      <CoolerStoryThemeConsumer>{props.children}</CoolerStoryThemeConsumer>
    </ThemeProvider>
  )
}
