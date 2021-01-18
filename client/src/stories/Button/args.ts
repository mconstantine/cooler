import { Color, LocalizedString } from '../../globalDomain'
import { colorControl } from '../args'

export interface ButtonArgs {
  label: LocalizedString
  icon: boolean
  color: Color
  flat: boolean
  disabled: boolean
}

export const buttonArgTypes = {
  label: {
    control: 'text'
  },
  icon: {
    control: 'boolean'
  },
  color: {
    control: colorControl
  },
  flat: {
    control: 'boolean'
  },
  disabled: {
    control: 'boolean'
  }
}
