import { pipe } from 'fp-ts/function'
import { ComponentProps, FC, ReactElement } from 'react'
import { composeClassName } from '../../../misc/composeClassName'
import { Button } from '../Button/Button'
import './Buttons.scss'

type Spacing = 'start' | 'spread'

interface Props {
  children: Array<ReactElement<ComponentProps<typeof Button>>>
  spacing?: Spacing
}

function foldSpacing<T>(
  whenStart: () => T,
  whenSpread: () => T
): (spacing: Spacing) => T {
  return spacing => {
    switch (spacing) {
      case 'start':
        return whenStart()
      case 'spread':
        return whenSpread()
    }
  }
}

export const Buttons: FC<Props> = ({ children, spacing = 'start' }) => {
  return (
    <div className={composeClassName('Buttons', spacing)}>
      {pipe(
        spacing,
        foldSpacing<any>(
          () => children,
          () => (
            <>
              <div>{children[0]}</div>
              <div>{children.slice(1)}</div>
            </>
          )
        )
      )}
    </div>
  )
}
