import { FC } from 'react'
import { Color } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Icon.scss'

interface IconProps {
  src: string
  color?: Color
  size?: 'large' | 'medium' | 'small'
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
