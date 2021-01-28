import { either } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { forwardRef, KeyboardEvent, Ref, useRef } from 'react'
import { a18n } from '../../../../a18n'
import { LocalizedString } from '../../../../globalDomain'
import { Label } from '../../../Label/Label'
import { FieldProps } from '../../useForm'
import { Input } from '../Input/Input'
import { leadZero, validateHours } from './utils'

interface Props {
  inputName: string
  hoursFieldProps: FieldProps<string>
  minutesFieldProps: FieldProps<string>
  onConfirm: () => unknown
}

export const TimePickerForm = forwardRef(
  (props: Props, ref?: Ref<HTMLInputElement>) => {
    const minutesInputRef = useRef<HTMLInputElement>(null)

    const onHoursChange = (value: string) => {
      pipe(
        value,
        validateHours,
        either.fold(
          () => props.hoursFieldProps.onChange(value),
          hours => {
            const shiftFocus = () =>
              window.setTimeout(() => {
                minutesInputRef.current?.focus()
                minutesInputRef.current?.select()
              }, 200)

            if (hours > 2 && hours < 10) {
              props.hoursFieldProps.onChange(`0${value}`)
              shiftFocus()
            } else {
              props.hoursFieldProps.onChange(value)
              value.length === 2 && shiftFocus()
            }
          }
        )
      )
    }

    const onInputKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        props.onConfirm()
      }
    }

    return (
      <div className="DateTimePickerTime">
        <Input
          ref={ref}
          label={a18n`Hours`}
          {...props.hoursFieldProps}
          id={props.inputName + props.hoursFieldProps.name}
          name={props.inputName + props.hoursFieldProps.name}
          onChange={onHoursChange}
          onKeyUp={onInputKeyUp}
          onBlur={() =>
            props.hoursFieldProps.onChange(
              leadZero(props.hoursFieldProps.value)
            )
          }
        />
        <Label content={':' as LocalizedString} />
        <Input
          ref={minutesInputRef}
          label={a18n`Minutes`}
          {...props.minutesFieldProps}
          id={props.inputName + props.minutesFieldProps.name}
          name={props.inputName + props.minutesFieldProps.name}
          onKeyUp={onInputKeyUp}
          onBlur={() =>
            props.minutesFieldProps.onChange(
              leadZero(props.minutesFieldProps.value)
            )
          }
        />
      </div>
    )
  }
)
