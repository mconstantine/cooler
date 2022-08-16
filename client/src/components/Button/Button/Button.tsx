import { boolean, option } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import { HTMLProps } from 'react'
import { Color, LocalizedString } from '../../../globalDomain'
import { composeClassName } from '../../../misc/composeClassName'
import { Icon } from '../../Icon/Icon'
import './Button.scss'

interface CommonProps
  extends Omit<HTMLProps<HTMLButtonElement>, 'action' | 'size'> {
  color?: Color
  disabled?: boolean
  selected?: boolean
  active?: boolean
  className?: string
}

interface DefaultButtonProps {
  type: 'button'
  label: LocalizedString
  icon: Option<string>
  flat?: boolean
  action: Reader<boolean, unknown>
}

interface IconButtonProps {
  type: 'iconButton'
  icon: string
  size?: 'large' | 'medium' | 'small'
  action: Reader<boolean, unknown>
}

export type ButtonProps = CommonProps & (DefaultButtonProps | IconButtonProps)

export function foldButtonProps<T>(
  whenButton: (props: DefaultButtonProps) => T,
  whenIconButton: (props: IconButtonProps) => T
): (props: ButtonProps) => T {
  return props => {
    switch (props.type) {
      case 'button':
        return whenButton(props)
      case 'iconButton':
        return whenIconButton(props)
    }
  }
}

export function Button(props: ButtonProps) {
  const color = props.color || 'default'
  const disabled = props.disabled || false
  const className = props.className || ''
  const selected = props.selected || false
  const active = props.active || false

  const disabledClassName = pipe(
    disabled,
    boolean.fold(
      () => '',
      () => 'disabled'
    )
  )

  const flatClassName = pipe(
    props,
    foldButtonProps(
      ({ flat = false }) =>
        pipe(
          flat,
          boolean.fold(
            () => '',
            () => 'flat'
          )
        ),
      () => ''
    )
  )

  const selectedClassName = pipe(
    selected,
    boolean.fold(
      () => '',
      () => 'selected'
    )
  )

  const activeClassName = pipe(
    active,
    boolean.fold(
      () => '',
      () => 'active'
    )
  )

  const withIconClassName = pipe(
    props,
    foldButtonProps(
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
        className,
        color,
        flatClassName,
        selectedClassName,
        activeClassName,
        disabledClassName,
        withIconClassName
      )}
      onClick={e => {
        e.preventDefault()

        if (disabled) {
          return
        }

        return props.action(e.ctrlKey || e.metaKey || e.button === 1)
      }}
    >
      {pipe(
        props,
        foldButtonProps(
          ({ icon }) =>
            pipe(
              icon,
              option.map(src => <Icon size="medium" color={color} src={src} />),
              option.toNullable
            ),
          ({ icon, size = 'medium' }) => (
            <Icon size={size} color={color} src={icon} />
          )
        )
      )}
      {pipe(
        props,
        foldButtonProps(({ label }) => <span>{label}</span>, constNull)
      )}
    </button>
  )
}
