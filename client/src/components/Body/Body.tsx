import { FC } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Body.scss'

export type TextEmphasis = 'full' | 'high' | 'medium' | 'low'

interface Props {
  color?: Color
  emphasis?: TextEmphasis
  className?: string
  children: LocalizedString
}

export const Body: FC<Props> = props => {
  const color = props.color || 'default'
  const emphasis = props.emphasis || 'full'

  return (
    <p
      className={composeClassName(
        'Body',
        color,
        emphasis,
        props.className || ''
      )}
    >
      {props.children}
    </p>
  )
}
