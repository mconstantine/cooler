import { either, option } from 'fp-ts'
import { constNull, constUndefined, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { checkmark, reload, skull } from 'ionicons/icons'
import { ComponentProps, FC, MouseEvent, useEffect, useState } from 'react'
import { Color, LocalizedString } from '../../../globalDomain'
import { composeClassName } from '../../../misc/composeClassName'
import { Icon } from '../../Icon/Icon'
import { Button } from '../Button/Button'
import './LoadingButton.scss'

type State = 'default' | 'loading' | 'success' | 'error'

type Props = Pick<
  ComponentProps<typeof Button>,
  'color' | 'flat' | 'disabled'
> & {
  label: LocalizedString
  action: TaskEither<any, any>
  icon: string
  labels?: {
    loading: LocalizedString
    success: LocalizedString
    error: LocalizedString
  }
}

function getIcon(state: State, defaultIcon: string): string {
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

function getColor(state: State, defaultColor: Color): Color {
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

export const LoadingButton: FC<Props> = ({
  flat = false,
  disabled = false,
  ...props
}) => {
  const [state, setState] = useState<State>('default')
  const [icon, setIcon] = useState(getIcon(state, props.icon))
  const [nextIcon, setNextIcon] = useState<Option<string>>(option.none)

  const color = getColor(state, props.color || 'default')
  const disabledClassName = disabled ? 'disabled' : ''
  const flatClassName = flat ? 'flat' : ''
  const stateClassName = `state-${state}`
  const iconAnimatingClassName = pipe(
    nextIcon,
    option.fold(
      () => '',
      () => 'animating'
    )
  )

  const onClick = (e: MouseEvent) => {
    e.preventDefault()

    if (disabled || state === 'loading') {
      return
    }

    setState('loading')

    props.action().then(
      flow(
        either.fold(
          () => setState('error'),
          () => setState('success')
        )
      )
    )
  }

  useEffect(() => {
    setNextIcon(option.some(getIcon(state, props.icon)))
  }, [state, props.icon])

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

  useEffect(() => {
    const timeout =
      state === 'success' || state === 'error'
        ? window.setTimeout(() => {
            setState('default')
          }, 2500)
        : undefined

    return () => window.clearTimeout(timeout)
  }, [state])

  return (
    <button
      className={composeClassName(
        'Button',
        'LoadingButton',
        disabledClassName,
        flatClassName,
        color,
        stateClassName
      )}
      onClick={onClick}
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
      <span>{props.label}</span>
    </button>
  )
}
