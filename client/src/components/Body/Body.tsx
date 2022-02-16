import { IO } from 'fp-ts/IO'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Body.scss'

export type TextEmphasis = 'full' | 'high' | 'medium' | 'low'

interface Props {
  color?: Color
  emphasis?: TextEmphasis
  className?: string
  onClick?: IO<void>
  children: LocalizedString
}

export function Body(props: Props) {
  const color = props.color || 'default'
  const emphasis = props.emphasis || 'full'
  const clickable = props.onClick ? 'clickable' : ''

  return (
    <p
      className={composeClassName(
        'Body',
        color,
        emphasis,
        clickable,
        props.className || ''
      )}
      onClick={props.onClick}
    >
      {props.children}
    </p>
  )
}
