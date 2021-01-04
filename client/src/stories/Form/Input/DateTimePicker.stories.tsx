import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { DateTimePicker as DateTimePickerComponent } from '../../../components/Form/Input/DateTimePicker/DateTimePicker'
import { Panel } from '../../../components/Panel/Panel'
import { CoolerStory } from '../../CoolerStory'

export const DateTimePicker: Story = () => {
  const [dateTime, setDateTime] = useState(new Date())
  const [date, setDate] = useState(new Date())
  const [time, setTime] = useState(new Date())

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <DateTimePickerComponent
            name="dateTime"
            label={unsafeLocalizedString('Date and time')}
            value={dateTime}
            onChange={setDateTime}
            error={option.none}
            warning={option.none}
          />
          <DateTimePickerComponent
            name="dateOnly"
            mode="date"
            label={unsafeLocalizedString('Date only')}
            value={date}
            onChange={setDate}
            error={option.none}
            warning={option.none}
          />
          <DateTimePickerComponent
            name="timeOnly"
            mode="time"
            label={unsafeLocalizedString('Time only')}
            value={time}
            onChange={setTime}
            error={option.none}
            warning={option.none}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Date Time Picker'
}

export default meta
