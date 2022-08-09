import { boolean, option } from 'fp-ts'
import { constNull, constTrue, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { Option } from 'fp-ts/Option'
import { alert, warning as warningIcon } from 'ionicons/icons'
import { LocalizedString } from '../../../../globalDomain'
import { composeClassName } from '../../../../misc/composeClassName'
import { Banner } from '../../../Banner/Banner'
import { FieldProps } from '../../useForm'
import './Toggle.scss'
import { ChangeEvent, useRef } from 'react'

type ToggleBooleanMode = 'boolean'
type ToggleThreeStateMode = '3-state'

interface BooleanProps extends FieldProps<boolean> {
  mode: ToggleBooleanMode
  label: LocalizedString
  disabled?: boolean
}

interface ThreeStateProps extends FieldProps<Option<boolean>> {
  mode: ToggleThreeStateMode
  label: LocalizedString
  disabled?: boolean
}

type Props = BooleanProps | ThreeStateProps

function foldProps<T>(cases: {
  [k in Props['mode']]: Reader<Extract<Props, { mode: k }>, T>
}): Reader<Props, T> {
  return props => cases[props.mode](props as any)
}

export function Toggle(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const checkedClassName = pipe(
    props,
    foldProps({
      boolean: props => (props.value ? 'checked' : ''),
      '3-state': props =>
        pipe(
          props.value,
          option.fold(
            () => 'indeterminate',
            value => (value ? 'checked' : '')
          )
        )
    })
  )

  const disabledClassName = props.disabled ? 'disabled' : ''

  const colorClassName = pipe(
    props.error,
    option.fold(
      () =>
        pipe(
          props.warning,
          option.fold(
            () => '',
            () => 'warning'
          )
        ),
      () => 'error'
    )
  )

  const value: boolean = pipe(
    props,
    foldProps({
      boolean: props => props.value,
      '3-state': props => pipe(props.value, option.getOrElse(constTrue))
    })
  )

  const onChange: Reader<ChangeEvent<HTMLInputElement>, void> = () =>
    pipe(
      props,
      foldProps({
        boolean: props => props.onChange(!props.value),
        '3-state': props =>
          pipe(
            props.value,
            option.fold(
              // none => true
              () => props.onChange(option.some(true)),
              boolean.fold(
                // false => none
                () => props.onChange(option.none),
                // true => false
                () => props.onChange(option.some(false))
              )
            )
          )
      })
    )

  return (
    <div
      className={composeClassName(
        'Toggle',
        checkedClassName,
        colorClassName,
        disabledClassName
      )}
    >
      <label htmlFor={props.name}>
        <input
          ref={inputRef}
          id={props.name}
          name={props.name}
          type="checkbox"
          checked={value}
          onChange={onChange}
          disabled={props.disabled}
        />
        <span className="label">{props.label}</span>
        <span className="switch" />
      </label>
      {pipe(
        props.error,
        option.fold(
          () =>
            pipe(
              props.warning,
              option.fold(constNull, warning => (
                <div className="warning">
                  <Banner
                    content={warning}
                    icon={warningIcon}
                    color="warning"
                  />
                </div>
              ))
            ),
          error => (
            <div className="error">
              <Banner content={error} icon={alert} color="danger" />
            </div>
          )
        )
      )}
    </div>
  )
}
