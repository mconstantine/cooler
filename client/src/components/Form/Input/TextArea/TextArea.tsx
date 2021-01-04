import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { alert, warning as warningIcon } from 'ionicons/icons'
import { forwardRef, InputHTMLAttributes, useState } from 'react'
import { LocalizedString } from '../../../../globalDomain'
import { composeClassName } from '../../../../misc/composeClassName'
import { Icon } from '../../../Icon/Icon'
import { Label } from '../../../Label/Label'
import { FieldProps } from '../../useForm'
import TextareaAutosize from 'react-autosize-textarea'
import './TextArea.scss'

type Props = Omit<
  InputHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'title'
> &
  FieldProps & {
    label: LocalizedString
  }

export const TextArea = forwardRef<HTMLTextAreaElement, Props>(
  ({ label, error, warning, className = '', ...props }, ref) => {
    const [isFocus, setIsFocus] = useState(false)
    const focusClassName = isFocus ? 'focus' : ''
    const disabledClassName = props.disabled ? 'disabled' : ''

    const colorClassName = pipe(
      error,
      option.fold(
        () =>
          pipe(
            warning,
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
          'TextArea',
          className,
          colorClassName,
          focusClassName,
          disabledClassName
        )}
      >
        <label htmlFor={props.name}>
          <span>{label}</span>
          <TextareaAutosize
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
            title={label}
          />
        </label>
        {pipe(
          error,
          option.fold(
            () =>
              pipe(
                warning,
                option.fold(
                  () => null,
                  warning => (
                    <div className="warning">
                      <Icon size="small" color="warning" src={warningIcon} />
                      <Label content={warning} />
                    </div>
                  )
                )
              ),
            error => (
              <div className="error">
                <Icon size="small" color="danger" src={alert} />
                <Label content={error} />
              </div>
            )
          )
        )}
      </div>
    )
  }
)
