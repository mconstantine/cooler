import { Meta, Story } from '@storybook/react'
import { either, option } from 'fp-ts'
import { unsafeLocalizedString, localizedMonthNames } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { CounterSelect as CounterSelectComponent } from '../../../components/Form/Input/CounterSelect/CounterSelect'
import { useSelectState } from '../../../components/Form/Input/Select/Select'
import { Panel } from '../../../components/Panel/Panel'
import { CoolerStory } from '../../CoolerStory'
import * as t from 'io-ts'
import { IntFromString, NonEmptyString } from 'io-ts-types'
import { LocalizedString } from '../../../globalDomain'
import { pipe } from 'fp-ts/function'

interface Args {
  label: LocalizedString
  error: LocalizedString
  warning: LocalizedString
  disabled: boolean
}

const CounterSelectTemplate: Story<Args> = props => {
  const [state, setState] = useSelectState(
    localizedMonthNames,
    option.some(0 as t.Int)
  )

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <CounterSelectComponent
            name="counterSelect"
            label={props.label}
            codec={IntFromString}
            value={state}
            onChange={setState}
            options={localizedMonthNames}
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
            onBack={n => (n - 1) as t.Int}
            onForward={n => (n + 1) as t.Int}
            disabled={props.disabled}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

export const CounterSelect = CounterSelectTemplate.bind({})

CounterSelect.args = {
  label: unsafeLocalizedString('Label'),
  error: unsafeLocalizedString(''),
  warning: unsafeLocalizedString(''),
  disabled: false
}

CounterSelect.argTypes = {
  label: {
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
  title: 'Cooler/Form/Inputs/Counter Select'
}

export default meta
