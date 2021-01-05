import { option } from 'fp-ts'
import { chevronBack, chevronForward } from 'ionicons/icons'
import { forwardRef } from 'react'
import { LocalizedString } from '../../../../globalDomain'
import { Button } from '../../../Button/Button/Button'
import { Select, SelectProps } from '../Select/Select'
import './CounterSelect.scss'

interface Props extends Omit<SelectProps, 'options'> {
  options: Record<number, LocalizedString>
  onBack: (currentOption: number) => number
  onForward: (currentValue: number) => number
}

export const CounterSelect = forwardRef<HTMLInputElement, Props>(
  ({ onBack, onForward, ...props }, ref) => {
    return (
      <Select {...props} ref={ref} className="Input CounterInput CounterSelect">
        <Button
          className="back"
          type="iconButton"
          icon={chevronBack}
          action={() => {
            const keys = Object.keys(props.options)
            const nextKey = onBack(parseInt(props.value)).toString(10)

            if (keys.includes(nextKey)) {
              props.onChange(nextKey)
            } else {
              props.onChange(keys[keys.length - 1])
            }
          }}
          disabled={
            props.value === '' || option.isSome(props.error) || props.disabled
          }
        />
        <Button
          className="forward"
          type="iconButton"
          icon={chevronForward}
          action={() => {
            const keys = Object.keys(props.options)
            const nextKey = onForward(parseInt(props.value)).toString(10)

            if (keys.includes(nextKey)) {
              props.onChange(nextKey)
            } else {
              props.onChange(keys[0])
            }
          }}
          disabled={
            props.value === '' || option.isSome(props.error) || props.disabled
          }
        />
      </Select>
    )
  }
)
