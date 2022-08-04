import { option } from 'fp-ts'
import { constVoid, flow } from 'fp-ts/function'
import {
  getOptionValue,
  Select,
  toSelectState,
  UnsearchableSelectProps
} from './Select/Select'
import * as t from 'io-ts'

interface Props<T extends string | number | symbol>
  extends Omit<
    UnsearchableSelectProps<T>,
    'type' | 'value' | 'onChange' | 'codec'
  > {
  value: T
  onChange: (value: T) => void
}

export function SimpleSelect<T extends string>(props: Props<T>) {
  return (
    <Select
      type="unsearchable"
      {...props}
      value={toSelectState(props.options, option.some(props.value))}
      onChange={flow(
        getOptionValue,
        option.fold(constVoid, value => props.onChange(value))
      )}
      codec={t.keyof(props.options)}
    />
  )
}
