import { PropsWithChildren } from 'react'
import '../../index.scss'

export function Cooler(props: PropsWithChildren<{}>) {
  return <div className="Cooler">{props.children}</div>
}
