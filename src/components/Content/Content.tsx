import { PropsWithChildren } from 'react'
import './Content.scss'

export function Content(props: PropsWithChildren<{}>) {
  return (
    <div className="Content" role="main">
      {props.children}
    </div>
  )
}
