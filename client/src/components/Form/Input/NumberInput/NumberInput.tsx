import { FC } from 'react'
import { Input, InputProps } from '../Input/Input'

interface Props extends Omit<InputProps, 'min' | 'max' | 'step'> {
  min?: number
  max?: number
  step?: number
}

export const NumberInput: FC<Props> = props => {
  return <Input type="number" {...props} />
}
