import { ComponentProps, FC, ReactElement } from 'react'
import { Button } from '../Button/Button'
import './Buttons.scss'

interface Props {
  children: ReactElement<ComponentProps<typeof Button>>[]
}

export const Buttons: FC<Props> = ({ children }) => {
  return <div className="Buttons">{children}</div>
}
