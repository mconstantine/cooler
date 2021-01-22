import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { pipe } from 'fp-ts/lib/pipeable'
import { NonEmptyString } from 'io-ts-types'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import {
  DateTimePicker as DateTimePickerComponent,
  DateTimePickerMode
} from '../../../components/Form/Input/DateTimePicker/DateTimePicker'
import { Panel } from '../../../components/Panel/Panel'
import { LocalizedString } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'

interface Args {
  label: LocalizedString
  mode: DateTimePickerMode
  error: string
  warning: string
}

export const DateTimePicker: Story<Args> = props => {
  const [date, setDate] = useState(new Date(2021, 0, 1, 12))

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <DateTimePickerComponent
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
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta<Args> = {
  title: 'Cooler/Form/Inputs/Date Time Picker',
  args: {
    label: unsafeLocalizedString('Date and time'),
    mode: 'datetime',
    error: '',
    warning: ''
  },
  argTypes: {
    mode: {
      control: {
        type: 'select',
        label: 'text',
        options: {
          Date: 'date',
          Time: 'time',
          Both: 'datetime'
        },
        error: 'text',
        warning: 'text'
      }
    }
  }
}

export default meta
