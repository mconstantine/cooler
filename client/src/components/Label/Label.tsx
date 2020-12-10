import { FC } from 'react'
import { LocalizedString } from '../../globalDomain'
import './Label.scss'

interface Props {
  content: LocalizedString
}

export const Label: FC<Props> = ({ content }) => {
  return <p className="Label">{content}</p>
}
