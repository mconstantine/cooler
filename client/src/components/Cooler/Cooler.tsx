import { FC } from 'react'
import '../../index.scss'

interface Props {
  theme: 'light' | 'dark'
}

export const Cooler: FC<Props> = ({ theme, children }) => {
  return <div className={`Cooler ${theme}`}>{children}</div>
}
