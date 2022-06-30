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
    name: 'Label',
    control: 'text'
  },
  icon: {
    name: 'Icon',
    control: 'boolean',
    description: 'Whether to show an icon or not'
  },
  color: {
    name: 'Color',
    control: colorControl
  },
  flat: {
    name: 'Flat style',
    control: 'boolean'
  },
  disabled: {
    name: 'Disabled',
    control: 'boolean'
  }
}
