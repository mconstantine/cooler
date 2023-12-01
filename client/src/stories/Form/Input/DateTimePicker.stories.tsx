import { Meta, StoryObj } from '@storybook/react'
import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { ComponentProps, useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { DateTimePicker } from '../../../components/Form/Input/DateTimePicker/DateTimePicker'
import { Panel } from '../../../components/Panel/Panel'

interface DateTimePickerStoryArgs
  extends Omit<ComponentProps<typeof DateTimePicker>, 'error' | 'warning'> {
  error: string
  warning: string
}

const meta: Meta<DateTimePickerStoryArgs> = {
  title: 'Cooler/Forms/Input/DateTimePicker',
  component: DateTimePicker as any,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    label: {
      name: 'Label',
      control: 'text'
    },
    mode: {
      name: 'Mode',
      control: {
        type: 'select',
        options: {
          Date: 'date',
          Time: 'time',
          'Date and time': 'datetime'
        }
      }
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
type Story = StoryObj<DateTimePickerStoryArgs>

export const Default: Story = {
  render: function Story(props) {
    const [date, setDate] = useState(new Date(2021, 4, 31, 12))

    return (
      <Content>
        <Panel framed actions={option.none}>
          <DateTimePicker
            name="dateTimePicker"
            mode={props.mode}
            label={props.label}
            value={date}
            onChange={setDate}
            error={pipe(
              props.error,
              NonEmptyString.decode,
              option.fromEither,
              option.map(unsafeLocalizedString)
            )}
            warning={pipe(
              props.warning,
              NonEmptyString.decode,
              option.fromEither,
              option.map(unsafeLocalizedString)
            )}
            disabled={props.disabled}
          />
        </Panel>
      </Content>
    )
  },
  args: {
    label: unsafeLocalizedString('Label'),
    mode: 'datetime',
    error: '',
    warning: '',
    disabled: false
  }
}
