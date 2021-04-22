import { option } from 'fp-ts'
import { constVoid } from 'fp-ts/function'
import { FC } from 'react'
import { LocalizedString } from '../../../../globalDomain'
import { Input } from '../Input/Input'
import './ReadOnlyInput.scss'

interface Props {
  name: string
  label: LocalizedString
  value: LocalizedString
}

export const ReadOnlyInput: FC<Props> = props => {
  return (
    <div className="ReadOnlyInput">
      <Input
        name={props.name}
        label={props.label}
        value={props.value}
        onChange={constVoid}
        error={option.none}
        warning={option.none}
        readOnly
      />
    </div>
  )
}
