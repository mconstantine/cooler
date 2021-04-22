import { FC } from 'react'
import './Content.scss'

export const Content: FC = ({ children }) => (
  <div className="Content" role="main">
    {children}
  </div>
)
