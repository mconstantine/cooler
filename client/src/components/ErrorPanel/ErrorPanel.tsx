import { option } from 'fp-ts'
import { FC } from 'react'
import { LocalizedString } from '../../globalDomain'
import { Body } from '../Body/Body'
import { Panel } from '../Panel/Panel'
import './ErrorPanel.scss'

interface Props {
  error: LocalizedString
}

export const ErrorPanel: FC<Props> = props => {
  return (
    <Panel className="ErrorPanel" action={option.none} framed color="danger">
      <Body>{props.error}</Body>
    </Panel>
  )
}
