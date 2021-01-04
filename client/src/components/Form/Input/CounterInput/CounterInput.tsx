import { option } from 'fp-ts'
import { constFalse } from 'fp-ts/lib/function'
import { chevronBack, chevronForward } from 'ionicons/icons'
import { forwardRef } from 'react'
import { Button } from '../../../Button/Button/Button'
import { Input, InputProps } from '../Input/Input'
import './CounterInput.scss'

interface Props extends InputProps {
  onBack: (currentValue: number) => number
  onForward: (currentValue: number) => number
  acceptNonNumericInput?: (input: string) => boolean
}

export const CounterInput = forwardRef<HTMLInputElement, Props>(
  (
    { onBack, onForward, acceptNonNumericInput = constFalse, ...props }: Props,
    ref
  ) => {
    return (
      <Input
        ref={ref}
        {...props}
        className="CounterInput"
        value={props.value}
        onChange={value => {
          if (
            value === '' ||
            value === '-' ||
            value.endsWith('.') ||
            acceptNonNumericInput(value)
          ) {
            props.onChange(value)
          } else {
            const n = parseFloat(value)
            !isNaN(n) && props.onChange(n.toString(10))
          }
        }}
      >
        <Button
          className="back"
          type="iconButton"
          icon={chevronBack}
          action={() =>
            props.onChange(onBack(parseFloat(props.value)).toString(10))
          }
          disabled={
            props.value === '' || option.isSome(props.error) || props.disabled
          }
        />
        <Button
          className="forward"
          type="iconButton"
          icon={chevronForward}
          action={() =>
            props.onChange(onForward(parseFloat(props.value)).toString(10))
          }
          disabled={
            props.value === '' || option.isSome(props.error) || props.disabled
          }
        />
      </Input>
    )
  }
)
