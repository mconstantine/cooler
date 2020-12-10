import { boolean, option } from 'fp-ts'
import { constNull, constUndefined, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { FC, MouseEvent } from 'react'
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

interface LinkProps {
  type: 'link'
  label: LocalizedString
  icon: Option<string>
  href: string
  target?: '_blank' | '_self'
}

interface IconButtonProps {
  type: 'iconButton'
  icon: string
  action: () => unknown
}

interface IconLinkProps {
  type: 'iconLink'
  icon: string
  href: string
  target?: '_blank' | '_self'
}

type Props = CommonProps &
  (ButtonProps | LinkProps | IconButtonProps | IconLinkProps)

function foldProps<T>(
  whenButton: (props: ButtonProps) => T,
  whenLink: (props: LinkProps) => T,
  whenIconButton: (props: IconButtonProps) => T,
  whenIconLink: (props: IconLinkProps) => T
): (props: Props) => T {
  return props => {
    switch (props.type) {
      case 'button':
        return whenButton(props)
      case 'link':
        return whenLink(props)
      case 'iconButton':
        return whenIconButton(props)
      case 'iconLink':
        return whenIconLink(props)
    }
  }
}

function foldLabelIcon<T>(
  whenLabel: (props: ButtonProps | LinkProps) => T,
  whenIcon: (props: IconButtonProps | IconLinkProps) => T
): (props: Props) => T {
  return flow(foldProps(whenLabel, whenLabel, whenIcon, whenIcon))
}

function foldButtonLink<T>(
  whenButton: (props: ButtonProps | IconButtonProps) => T,
  whenLink: (props: LinkProps | IconLinkProps) => T
): (props: Props) => T {
  return flow(foldProps(whenButton, whenLink, whenButton, whenLink))
}

export const Button: FC<Props> = ({
  color = 'default',
  disabled = false,
  flat = false,
  ...props
}) => {
  const href = pipe(
    props,
    foldButtonLink(constUndefined, props => props.href)
  )

  const target = pipe(
    props,
    foldButtonLink(constUndefined, props => props.target || '_self')
  )

  const onClick = pipe(
    props,
    foldButtonLink(
      props => (e: MouseEvent) => {
        e.preventDefault()

        if (disabled) {
          return
        }

        return props.action()
      },
      () => (e: MouseEvent) => {
        if (disabled) {
          e.preventDefault()
        }
      }
    )
  )

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
    foldLabelIcon(
      props =>
        pipe(
          props.icon,
          option.fold(
            () => '',
            () => 'withIcon'
          )
        ),
      () => 'iconOnly'
    )
  )

  return (
    <a
      className={composeClassName(
        'Button',
        color,
        flatClassName,
        disabledClassName,
        withIconClassName
      )}
      href={href}
      target={target}
      onClick={onClick}
    >
      {pipe(
        props,
        foldLabelIcon(
          props =>
            pipe(
              props.icon,
              option.map(src => <Icon size="medium" color={color} src={src} />),
              option.toNullable
            ),
          props => <Icon size="medium" color={color} src={props.icon} />
        )
      )}
      {pipe(
        props,
        foldLabelIcon(props => <span>{props.label}</span>, constNull)
      )}
    </a>
  )
}
