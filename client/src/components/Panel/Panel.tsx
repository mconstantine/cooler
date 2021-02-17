import { Option } from 'fp-ts/Option'
import { FC } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { HeadingAction, Heading } from '../Heading/Heading'
import './Panel.scss'

interface Props {
  title?: LocalizedString
  framed?: boolean
  className?: string
  action: Option<HeadingAction>
  color?: Color
}

export const Panel: FC<Props> = props => {
  const framedClassName = props.framed ? 'framed' : ''
  const colorClassName = props.color || 'default'

  return (
    <div
      className={composeClassName(
        'Panel',
        props.className || '',
        framedClassName,
        colorClassName
      )}
    >
      {props.title ? (
        <Heading size={32} action={props.action}>
          {props.title}
        </Heading>
      ) : null}
      {props.children}
    </div>
  )
}
