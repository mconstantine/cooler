import { Meta, StoryObj } from '@storybook/react'
import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { NonEmptyString } from 'io-ts-types'
import { ComponentProps, useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { Toggle } from '../../../components/Form/Input/Toggle/Toggle'
import { Panel } from '../../../components/Panel/Panel'
import { LocalizedString } from '../../../globalDomain'

interface ToggleStoryArgs
  extends Omit<ComponentProps<typeof Toggle>, 'error' | 'warning'> {
  error: LocalizedString
  warning: LocalizedString
  booleanLabel: LocalizedString
  threeStateLabel: LocalizedString
}

const meta: Meta<ToggleStoryArgs> = {
  title: 'Cooler/Forms/Input/Toggle',
  component: Toggle as any,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
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
}

export default meta
type Story = StoryObj<ToggleStoryArgs>

export const Default: Story = {
  render: function Story(props) {
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
      <Content>
        <Panel framed actions={option.none}>
          <Toggle
            mode="boolean"
            label={props.booleanLabel}
            name="boolean"
            value={booleanValue}
            onChange={setBooleanValue}
            error={error}
            warning={warning}
            disabled={props.disabled}
          />
          <Toggle
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
    )
  },
  args: {
    booleanLabel: unsafeLocalizedString('Boolean toggle (true, false)'),
    threeStateLabel: unsafeLocalizedString(
      '3-state toggle (true, false, nothing)'
    ),
    error: unsafeLocalizedString(''),
    warning: unsafeLocalizedString(''),
    disabled: false
  }
}
