import { boolean, option } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { FC } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { Icon } from '../Icon/Icon'
import './Button.scss'

interface CommonProps {
  color?: Color
  flat?: boolean
  disabled?: boolean
}

interface ButtonProps {
  type: 'button'
  label: LocalizedString
  icon: Option<string>
  action: () => unknown
}

interface IconButtonProps {
  type: 'iconButton'
  icon: string
  action: () => unknown
}

type Props = CommonProps & (ButtonProps | IconButtonProps)

function foldProps<T>(
  whenButton: (props: ButtonProps) => T,
  whenIconButton: (props: IconButtonProps) => T
): (props: Props) => T {
  return props => {
    switch (props.type) {
      case 'button':
        return whenButton(props)
      case 'iconButton':
        return whenIconButton(props)
    }
  }
}

export const Button: FC<Props> = ({
  color = 'default',
  disabled = false,
  flat = false,
  ...props
}) => {
  const disabledClassName = pipe(
    disabled,
    boolean.fold(
      () => '',
      () => 'disabled'
    )
  )

  const flatClassName = pipe(
    flat,
    boolean.fold(
      () => '',
      () => 'flat'
    )
  )

  const withIconClassName = pipe(
    props,
    foldProps(
      ({ icon }) =>
        pipe(
          icon,
          option.fold(
            () => '',
            () => 'withIcon'
          )
        ),
      () => 'iconOnly'
    )
  )

  return (
    <button
      className={composeClassName(
        'Button',
        color,
        flatClassName,
        disabledClassName,
        withIconClassName
      )}
      onClick={e => {
        e.preventDefault()

        if (disabled) {
          return
        }

        return props.action()
      }}
    >
      {pipe(
        props,
        foldProps(
          ({ icon }) =>
            pipe(
              icon,
              option.map(src => <Icon size="medium" color={color} src={src} />),
              option.toNullable
            ),
          ({ icon }) => <Icon size="medium" color={color} src={icon} />
        )
      )}
      {pipe(
        props,
        foldProps(({ label }) => <span>{label}</span>, constNull)
      )}
    </button>
  )
}
