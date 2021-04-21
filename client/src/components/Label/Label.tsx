import { FC } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import './Label.scss'

interface Props {
  message: LocalizedString
  color?: Color
}

export const Label: FC<Props> = ({ message, color = 'default' }) => {
  return <label className={composeClassName('Label', color)}>{message}</label>
}
