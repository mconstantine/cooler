import { Option } from 'fp-ts/Option'
import { FC } from 'react'
import { LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { HeadingAction, Heading } from '../Heading/Heading'
import './Panel.scss'

interface Props {
  title?: LocalizedString
  framed?: boolean
  className?: string
  action: Option<HeadingAction>
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
      {props.title ? (
        <Heading size={32} action={props.action}>
          {props.title}
        </Heading>
      ) : null}
      {props.children}
    </div>
  )
}
