import { FC } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Body.scss'

interface Props {
  color?: Color
  children: LocalizedString
}

export const Body: FC<Props> = props => {
  return (
    <p className={composeClassName('Body', props.color || 'default')}>
      {props.children}
    </p>
  )
}
