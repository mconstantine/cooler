import { Color, Size } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Loading.scss'

export interface LoadingProps {
  color?: Color
  size?: Size
}

export function Loading(props: LoadingProps) {
  const color = props.color || 'default'
  const size = props.size || 'large'

  return (
    <div className={composeClassName('Loading', color, size)}>
      <div />
    </div>
  )
}
