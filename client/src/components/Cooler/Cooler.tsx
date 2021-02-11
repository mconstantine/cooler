import { FC } from 'react'
import '../../index.scss'

interface Props {}

export const Cooler: FC<Props> = props => {
  return <div className="Cooler">{props.children}</div>
}
