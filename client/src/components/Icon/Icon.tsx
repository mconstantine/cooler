import { FC } from 'react'
import { Color, Size } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Icon.scss'

interface IconProps {
  src: string
  color?: Color
  size?: Size
  className?: string
}

export const Icon: FC<IconProps> = ({
  src,
  color = 'default',
  size = 'large',
  className = ''
}) => {
  return (
    <span
      className={composeClassName('Icon', color, size, className)}
      dangerouslySetInnerHTML={{ __html: src.substring(24) }}
    />
  )
}
