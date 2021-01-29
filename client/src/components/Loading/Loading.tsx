import { FC } from 'react'
import { Color, Size } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Loading.scss'

export interface LoadingProps {
  color?: Color
  size?: Size
}

export const Loading: FC<LoadingProps> = ({
  color = 'default',
  size = 'large'
}) => {
  return (
    <div className={composeClassName('Loading', color, size)}>
      <div />
    </div>
  )
}
