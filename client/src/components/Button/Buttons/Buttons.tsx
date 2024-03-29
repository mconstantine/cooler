import { pipe } from 'fp-ts/function'
import { ComponentProps, FC, ReactElement } from 'react'
import { composeClassName } from '../../../misc/composeClassName'
import { Button } from '../Button/Button'
import './Buttons.scss'

type ButtonElement = ReactElement<ComponentProps<typeof Button>>

interface ButtonsRowProps {
  spacing?: 'start'
  children: ButtonElement | ButtonElement[]
  className?: string
}

interface SpreadButtonsProps {
  spacing: 'spread'
  children: ButtonElement[]
  className?: string
}

type Props = ButtonsRowProps | SpreadButtonsProps

function foldProps<T>(
  whenStart: (props: ButtonsRowProps) => T,
  whenSpread: (props: SpreadButtonsProps) => T
): (props: Props) => T {
  return props => {
    switch (props.spacing) {
      case undefined:
      case 'start':
        return whenStart(props)
      case 'spread':
        return whenSpread(props)
    }
  }
}

export const Buttons: FC<Props> = props => {
  return (
    <div
      className={composeClassName(
        'Buttons',
        props.spacing || 'start',
        props.className || ''
      )}
    >
      {pipe(
        props,
        foldProps<any>(
          props => props.children,
          props => (
            <>
              <div>{props.children[0]}</div>
              <div>{props.children.slice(1)}</div>
            </>
          )
        )
      )}
    </div>
  )
}
