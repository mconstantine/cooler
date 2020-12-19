import { FC } from 'react'
import { InputProps, Input } from '../Input/Input'

export interface TextInputProps extends Omit<InputProps, 'type'> {
  type?: 'text' | 'password' | 'email'
}

export const TextInput: FC<TextInputProps> = ({ type, ...props }) => {
  return <Input type={type || 'text'} {...props} />
}
