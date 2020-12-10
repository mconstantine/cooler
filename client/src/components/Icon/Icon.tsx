import { FC } from 'react'
import { Color } from '../../globalDomain'
import './Icon.scss'

interface IconProps {
  src: string
  color?: Color
  size?: 'large' | 'medium' | 'small'
}

export const Icon: FC<IconProps> = ({
  src,
  color = 'default',
  size = 'large'
}) => {
  return (
    <span
      className={`Icon ${color} ${size}`}
      dangerouslySetInnerHTML={{ __html: src.substring(24) }}
    />
  )
}
