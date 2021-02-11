import { FC } from 'react'
import '../../index.scss'
import { useTheme } from '../contexts/ThemeContext'

interface Props {}

export const Cooler: FC<Props> = props => {
  const { theme } = useTheme()
  return <div className={`Cooler ${theme}`}>{props.children}</div>
}
