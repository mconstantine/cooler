import { FC } from 'react'
import { LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Panel.scss'

interface Props {
  title?: LocalizedString
  framed?: boolean
  className?: string
}

export const Panel: FC<Props> = props => {
  const framedClassName = props.framed ? 'framed' : ''

  return (
    <div
      className={composeClassName(
        'Panel',
        props.className || '',
        framedClassName
      )}
    >
      {props.title ? <h3>{props.title}</h3> : null}
      {props.children}
    </div>
  )
}
