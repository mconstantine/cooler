import { FC } from 'react'
import { useDarkMode } from 'storybook-dark-mode'
import { Cooler } from '../components/Cooler/Cooler'

export const CoolerStory: FC = ({ children }) => {
  const isDarkMode = useDarkMode()
  const theme = isDarkMode ? 'dark' : 'light'

  return <Cooler theme={theme}>{children}</Cooler>
}
