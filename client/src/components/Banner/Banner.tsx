import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { Icon } from '../Icon/Icon'
import './Banner.scss'

interface Props {
  content: LocalizedString
  icon?: string
  color?: Color
}

export function Banner(props: Props) {
  const color = props.color || 'default'

  return (
    <p
      role="banner"
      aria-label={props.content}
      className={composeClassName('Banner', color)}
    >
      {props.icon ? <Icon color={color} src={props.icon} size="small" /> : null}
      {props.content}
    </p>
  )
}
