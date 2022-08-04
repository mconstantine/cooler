import { Color, Size } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Icon.scss'

interface IconProps {
  src: string
  color?: Color
  size?: Size
  className?: string
}

export function Icon(props: IconProps) {
  const color = props.color || 'default'
  const size = props.size || 'large'
  const className = props.className || ''

  return (
    <span
      aria-hidden
      className={composeClassName('Icon', color, size, className)}
      dangerouslySetInnerHTML={{ __html: props.src.substring(24) }}
    />
  )
}
