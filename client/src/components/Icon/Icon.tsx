import { FC } from 'react'
import './Icon.scss'

interface IconProps {
  src: string
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
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
