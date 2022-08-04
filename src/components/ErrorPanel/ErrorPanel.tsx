import { option } from 'fp-ts'
import { LocalizedString } from '../../globalDomain'
import { Body } from '../Body/Body'
import { Panel } from '../Panel/Panel'
import './ErrorPanel.scss'

interface Props {
  error: LocalizedString
}

export function ErrorPanel(props: Props) {
  return (
    <Panel className="ErrorPanel" action={option.none} framed color="danger">
      <Body>{props.error}</Body>
    </Panel>
  )
}
