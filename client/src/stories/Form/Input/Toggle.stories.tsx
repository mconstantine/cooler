import { Meta, Story } from '@storybook/react'
import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { NonEmptyString } from 'io-ts-types'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { Toggle as ToggleComponent } from '../../../components/Form/Input/Toggle/Toggle'
import { Panel } from '../../../components/Panel/Panel'
import { LocalizedString } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'

interface Args {
  booleanLabel: LocalizedString
  threeStateLabel: LocalizedString
  error: LocalizedString
  warning: LocalizedString
  disabled: boolean
}

const ToggleTemplate: Story<Args> = props => {
  const [booleanValue, setBooleanValue] = useState(false)
  const [threeStateValue, setThreeStateValue] = useState<Option<boolean>>(
    option.none
  )

  const error = pipe(
    props.error,
    NonEmptyString.decode,
    either.fold(
      () => option.none,
      () => option.some(props.error)
    )
  )

  const warning = pipe(
    props.warning,
    NonEmptyString.decode,
    either.fold(
      () => option.none,
      () => option.some(props.warning)
    )
  )

  return (
    <CoolerStory>
      <Content>
        <Panel framed actions={option.none}>
          <ToggleComponent
            mode="boolean"
            label={props.booleanLabel}
            name="boolean"
            value={booleanValue}
            onChange={setBooleanValue}
            error={error}
            warning={warning}
            disabled={props.disabled}
          />
          <ToggleComponent
            mode="3-state"
            label={props.threeStateLabel}
            name="3-state"
            value={threeStateValue}
            onChange={setThreeStateValue}
            error={error}
            warning={warning}
            disabled={props.disabled}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

export const Toggle = ToggleTemplate.bind({})

Toggle.args = {
  booleanLabel: unsafeLocalizedString('Boolean toggle (true, false)'),
  threeStateLabel: unsafeLocalizedString(
    '3-state toggle (true, false, nothing)'
  ),
  error: unsafeLocalizedString(''),
  warning: unsafeLocalizedString(''),
  disabled: false
}

Toggle.argTypes = {
  booleanLabel: {
    name: 'Label',
    control: 'text'
  },
  threeStateLabel: {
    name: 'Label',
    control: 'text'
  },
  error: {
    name: 'Error',
    control: 'text'
  },
  warning: {
    name: 'Warning',
    control: 'text'
  },
  disabled: {
    name: 'Disabled',
    control: 'boolean'
  }
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Toggle'
}

export default meta
