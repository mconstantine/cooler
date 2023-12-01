import { Meta, StoryObj } from '@storybook/react'
import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { ComponentProps, useState } from 'react'
import { a18n, unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { WeekdayRepetition } from '../../../components/Form/Input/WeekdayRepetition/WeekdayRepetition'
import { Panel } from '../../../components/Panel/Panel'
import {
  LocalizedString,
  unsafeNonNegativeInteger
} from '../../../globalDomain'
import { colorControl } from '../../args'

export interface WeekdayRepetitionStoryArgs
  extends Omit<ComponentProps<typeof WeekdayRepetition>, 'error' | 'warning'> {
  error: LocalizedString
  warning: LocalizedString
}

const meta: Meta<WeekdayRepetitionStoryArgs> = {
  title: 'Cooler/Forms/Input/WeekdayRepetition',
  component: WeekdayRepetition as any,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    error: {
      name: 'Error',
      control: 'text'
    },
    warning: {
      name: 'Warning',
      control: 'text'
    },
    color: {
      name: 'Color',
      control: colorControl
    },
    disabled: {
      name: 'Disabled',
      control: 'boolean'
    }
  }
}

export default meta
type Story = StoryObj<WeekdayRepetitionStoryArgs>

export const Default: Story = {
  render: function Story(props) {
    const [state, setState] = useState(unsafeNonNegativeInteger(0x0000000))

    return (
      <Content>
        <Panel framed actions={option.none}>
          <WeekdayRepetition
            name="weekdayRepetition"
            label={a18n`Repeat on`}
            value={state}
            onChange={setState}
            error={pipe(
              props.error,
              NonEmptyString.decode,
              either.fold(
                () => option.none,
                () => option.some(props.error)
              )
            )}
            warning={pipe(
              props.warning,
              NonEmptyString.decode,
              either.fold(
                () => option.none,
                () => option.some(props.warning)
              )
            )}
            color={props.color}
            disabled={props.disabled}
          />
        </Panel>
      </Content>
    )
  },
  args: {
    error: unsafeLocalizedString(''),
    warning: unsafeLocalizedString(''),
    color: 'default',
    disabled: false
  }
}
