import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { alert } from 'ionicons/icons'
import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { LocalizedString } from '../../../../globalDomain'
import { composeClassName } from '../../../../misc/composeClassName'
import { Icon } from '../../../Icon/Icon'
import { Label } from '../../../Label/Label'
import { FieldProps } from '../../useForm'
import './Input.scss'

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'title'
> &
  FieldProps & {
    label: LocalizedString
  }

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ onInvalid, ...props }: InputProps, ref) => {
    const [isFocus, setIsFocus] = useState(false)
    const focusClassName = isFocus ? 'focus' : ''
    const disabledClassName = props.disabled ? 'disabled' : ''

    const errorClassName = pipe(
      props.error,
      option.fold(
        () => '',
        () => 'error'
      )
    )

    return (
      <div
        className={composeClassName(
          'Input',
          errorClassName,
          focusClassName,
          disabledClassName
        )}
      >
        <label htmlFor={props.name}>
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
        </label>
        {pipe(
          props.error,
          option.map(error => (
            <div className="error">
              <Icon size="small" color="danger" src={alert} />
              <Label content={error} />
            </div>
          )),
          option.toNullable
        )}
      </div>
    )
  }
)
