import { forwardRef } from 'react'
import { InputProps, Input } from '../Input/Input'

export interface TextInputProps extends Omit<InputProps, 'type'> {
  type?: 'text' | 'password' | 'email'
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ type, ...props }, ref) => {
    return <Input type={type || 'text'} ref={ref} {...props} />
  }
)
