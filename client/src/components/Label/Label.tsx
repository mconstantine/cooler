import { FC } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { Icon } from '../Icon/Icon'
import './Label.scss'

interface Props {
  content: LocalizedString
  icon?: string
  color?: Color
}

export const Label: FC<Props> = ({ content, icon, color = 'default' }) => {
  return (
    <p className={composeClassName('Label', color)}>
      {icon ? <Icon color={color} src={icon} size="small" /> : null}
      {content}
    </p>
  )
}
