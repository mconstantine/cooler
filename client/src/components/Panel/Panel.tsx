import { FC } from 'react'
import { LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Panel.scss'

interface Props {
  title?: LocalizedString
  framed?: boolean
}

export const Panel: FC<Props> = ({ title, framed, children }) => {
  const framedClassName = framed ? 'framed' : ''

  return (
    <div className={composeClassName('Panel', framedClassName)}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  )
}
