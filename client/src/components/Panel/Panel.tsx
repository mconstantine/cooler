import { FC } from 'react'
import { LocalizedString } from '../../globalDomain'
import './Panel.scss'

interface Props {
  title?: LocalizedString
}

export const Panel: FC<Props> = ({ title, children }) => (
  <div className="Panel">
    {title ? <h3>{title}</h3> : null}
    {children}
  </div>
)
