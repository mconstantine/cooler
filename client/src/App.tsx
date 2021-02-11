import { FC } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Cooler } from './components/Cooler/Cooler'
import { Menu } from './components/Menu/Menu'

interface Props {}

export const App: FC<Props> = () => {
  return (
    <ThemeProvider>
      <Cooler>
        <Menu />
      </Cooler>
    </ThemeProvider>
  )
}
