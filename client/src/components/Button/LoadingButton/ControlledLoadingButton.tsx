import { option } from 'fp-ts'
import { constNull, constUndefined, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { checkmark, reload, skull } from 'ionicons/icons'
import { ComponentProps, FC, MouseEvent, useEffect, useState } from 'react'
import { Color, LocalizedString } from '../../../globalDomain'
import { composeClassName } from '../../../misc/composeClassName'
import { Icon } from '../../Icon/Icon'
import { Button } from '../Button/Button'
import './LoadingButton.scss'

export type LoadingState = 'default' | 'loading' | 'success' | 'error'

export type CommonProps = Pick<
  ComponentProps<typeof Button>,
  'color' | 'flat' | 'disabled'
> & {
  loadingState: LoadingState
  label: LocalizedString
  icon: string
  labels?: {
    loading: LocalizedString
    success: LocalizedString
    error: LocalizedString
  }
}

export interface ButtonProps extends CommonProps {
  type: 'button'
  action: TaskEither<any, any>
}

export interface InputProps extends CommonProps {
  type: 'input'
}

type Props = ButtonProps | InputProps

function foldProps<T>(
  whenButton: (props: ButtonProps) => T,
  whenInput: (props: InputProps) => T
): (prop: Props) => T {
  return props => {
    switch (props.type) {
      case 'button':
        return whenButton(props)
      case 'input':
        return whenInput(props)
    }
  }
}

function getIcon(state: LoadingState, defaultIcon: string): string {
  switch (state) {
    case 'default':
      return defaultIcon
    case 'loading':
      return reload
    case 'success':
      return checkmark
    case 'error':
      return skull
  }
}

function getColor(state: LoadingState, defaultColor: Color): Color {
  switch (state) {
    case 'default':
    case 'loading':
      return defaultColor
    case 'success':
      return 'success'
    case 'error':
      return 'danger'
  }
}

export const ControlledLoadingButton: FC<Props> = ({
  flat = false,
  disabled = false,
  ...props
}) => {
  const [icon, setIcon] = useState(getIcon(props.loadingState, props.icon))
  const [nextIcon, setNextIcon] = useState<Option<string>>(option.none)

  const color = getColor(props.loadingState, props.color || 'default')
  const disabledClassName = disabled ? 'disabled' : ''
  const flatClassName = flat ? 'flat' : ''
  const stateClassName = `state-${props.loadingState}`
  const iconAnimatingClassName = pipe(
    nextIcon,
    option.fold(
      () => '',
      () => 'animating'
    )
  )

  useEffect(() => {
    setNextIcon(option.some(getIcon(props.loadingState, props.icon)))
  }, [props.loadingState, props.icon])

  useEffect(() => {
    const timeout = pipe(
      nextIcon,
      option.fold(constUndefined, icon =>
        window.setTimeout(() => {
          setIcon(icon)
          setNextIcon(option.none)
        }, 150)
      )
    )

    return () => window.clearTimeout(timeout)
  }, [nextIcon])

  return (
    <div
      className={composeClassName(
        'Button',
        'LoadingButton',
        disabledClassName,
        flatClassName,
        color,
        stateClassName
      )}
    >
      <span
        className={composeClassName(
          'iconsAnimationWrapper',
          iconAnimatingClassName
        )}
      >
        <Icon size="medium" src={icon} color={color} />
        {pipe(
          nextIcon,
          option.fold(constNull, icon => (
            <Icon className="nextIcon" size="medium" src={icon} color={color} />
          ))
        )}
      </span>
      {pipe(
        props,
        foldProps(
          props => {
            const action = (e: MouseEvent) => {
              e.preventDefault()

              if (props.disabled || props.loadingState === 'loading') {
                return
              }

              props.action()
            }

            return <button onClick={action}>{props.label}</button>
          },
          props => <input type="submit" value={props.label} />
        )
      )}
    </div>
  )
}
