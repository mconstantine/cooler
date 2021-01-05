import { FC } from 'react'
import { Color, Size } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Loading.scss'

interface Props {
  color?: Color
  size?: Size
}

export const Loading: FC<Props> = ({ color = 'default', size = 'large' }) => {
  return (
    <div className={composeClassName('Loading', color, size)}>
      <div />
    </div>
  )
}
