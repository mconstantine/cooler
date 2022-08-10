import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
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
  disabled: boolean
}

const DateTimePickerTemplate: Story<Args> = props => {
  const [date, setDate] = useState(new Date(2021, 0, 1, 12))

  return (
    <CoolerStory>
      <Content>
        <Panel framed actions={option.none}>
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
            disabled={props.disabled}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

export const DateTimePicker = DateTimePickerTemplate.bind({})

DateTimePicker.args = {
  label: unsafeLocalizedString('Label'),
  mode: 'datetime',
  error: '',
  warning: '',
  disabled: false
}

DateTimePicker.argTypes = {
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

const meta: Meta<Args> = {
  title: 'Cooler/Form/Inputs/Date Time Picker'
}

export default meta
