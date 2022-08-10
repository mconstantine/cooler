import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Option } from 'fp-ts/Option'
import { PropsWithChildren } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { HeadingAction, Heading } from '../Heading/Heading'
import './Panel.scss'

interface Props {
  title?: LocalizedString
  framed?: boolean
  className?: string
  actions: Option<NonEmptyArray<HeadingAction>>
  color?: Color
}

export function Panel(props: PropsWithChildren<Props>) {
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
        <Heading size={32} actions={props.actions}>
          {props.title}
        </Heading>
      ) : null}
      {props.children}
    </div>
  )
}
