import { Color, Size } from '../globalDomain'

interface ColorControl {
  type: 'select'
  options: Record<string, Color>
}

interface SizeControl {
  type: 'select'
  options: Record<string, Size>
}

export const colorControl: ColorControl = {
  type: 'select',
  options: {
    Default: 'default',
    Primary: 'primary',
    Success: 'success',
    Warning: 'warning',
    Danger: 'danger'
  }
}

export const sizeControl: SizeControl = {
  type: 'select',
  options: {
    Small: 'small',
    Medium: 'medium',
    Large: 'large'
  }
}
