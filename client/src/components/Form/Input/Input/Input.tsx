import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { alert, warning as warningIcon } from 'ionicons/icons'
import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { LocalizedString } from '../../../../globalDomain'
import { composeClassName } from '../../../../misc/composeClassName'
import { Banner } from '../../../Banner/Banner'
import { FieldProps } from '../../useForm'
import './Input.scss'

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'title'
> &
  FieldProps<string> & {
    label: LocalizedString
  }

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const [isFocus, setIsFocus] = useState(false)
  const focusClassName = isFocus ? 'focus' : ''
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

  return (
    <div
      className={composeClassName(
        'Input',
        props.className || '',
        colorClassName,
        focusClassName,
        disabledClassName
      )}
    >
      <label htmlFor={props.name}>
        <div className="value">
          <span>{props.label}</span>
          <input
            {...props}
            ref={ref}
            id={props.name}
            value={props.value}
            onChange={e => props.onChange(e.currentTarget.value)}
            onFocus={e => {
              props.onFocus?.(e)
              setIsFocus(true)
            }}
            onBlur={e => {
              props.onBlur?.(e)
              setIsFocus(false)
            }}
            title={props.label}
          />
        </div>
        {props.children}
      </label>
      {pipe(
        props.error,
        option.fold(
          () =>
            pipe(
              props.warning,
              option.fold(
                () => null,
                warning => (
                  <div className="warning">
                    <Banner
                      content={warning}
                      icon={warningIcon}
                      color="warning"
                    />
                  </div>
                )
              )
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
})
