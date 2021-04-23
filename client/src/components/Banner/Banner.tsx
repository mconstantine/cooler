import { FC } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { Icon } from '../Icon/Icon'
import './Banner.scss'

interface Props {
  content: LocalizedString
  icon?: string
  color?: Color
}

export const Banner: FC<Props> = ({ content, icon, color = 'default' }) => {
  return (
    <p
      role="banner"
      aria-label={content}
      className={composeClassName('Banner', color)}
    >
      {icon ? <Icon color={color} src={icon} size="small" /> : null}
      {content}
    </p>
  )
}
