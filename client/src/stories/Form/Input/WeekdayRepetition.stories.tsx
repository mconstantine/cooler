import { Meta, Story } from '@storybook/react'
import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { useState } from 'react'
import { a18n, unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { WeekdayRepetition as WeekdayRepetitionComponent } from '../../../components/Form/Input/WeekdayRepetition/WeekdayRepetition'
import { Panel } from '../../../components/Panel/Panel'
import {
  Color,
  LocalizedString,
  unsafeNonNegativeInteger
} from '../../../globalDomain'
import { colorControl } from '../../args'
import { CoolerStory } from '../../CoolerStory'

interface Args {
  error: LocalizedString
  warning: LocalizedString
  color: Color
  disabled: boolean
}

const WeekdayRepetitionTemplate: Story<Args> = props => {
  const [state, setState] = useState(unsafeNonNegativeInteger(0x0000000))

  return (
    <CoolerStory>
      <Content>
        <Panel framed actions={option.none}>
          <WeekdayRepetitionComponent
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
    </CoolerStory>
  )
}

export const WeekdayRepetition = WeekdayRepetitionTemplate.bind({})

WeekdayRepetition.args = {
  error: unsafeLocalizedString(''),
  warning: unsafeLocalizedString(''),
  color: 'default',
  disabled: false
}

WeekdayRepetition.argTypes = {
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

const meta: Meta<Args> = {
  title: 'Cooler/Form/Inputs/Weekday Repetition'
}

export default meta
