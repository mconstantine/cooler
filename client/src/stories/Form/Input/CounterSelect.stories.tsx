import { Meta, StoryObj } from '@storybook/react'
import { either, option } from 'fp-ts'
import { unsafeLocalizedString, localizedMonthNames } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { CounterSelect } from '../../../components/Form/Input/CounterSelect/CounterSelect'
import { useSelectState } from '../../../components/Form/Input/Select/Select'
import { Panel } from '../../../components/Panel/Panel'
import * as t from 'io-ts'
import { IntFromString, NonEmptyString } from 'io-ts-types'
import { pipe } from 'fp-ts/function'
import { ComponentProps } from 'react'
import { LocalizedString } from '../../../globalDomain'

interface CounterSelectStoryArgs
  extends Omit<ComponentProps<typeof CounterSelect>, 'error' | 'warning'> {
  error: LocalizedString
  warning: LocalizedString
}

const meta: Meta<CounterSelectStoryArgs> = {
  title: 'Cooler/Forms/Input/CounterSelect',
  component: CounterSelect as any,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
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
}

export default meta
type Story = StoryObj<CounterSelectStoryArgs>

export const Default: Story = {
  render: function Story(props) {
    const [state, setState] = useSelectState(
      localizedMonthNames,
      option.some(0 as t.Int)
    )

    return (
      <Content>
        <Panel framed actions={option.none}>
          <CounterSelect
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
    )
  },
  args: {
    label: unsafeLocalizedString('Label'),
    error: unsafeLocalizedString(''),
    warning: unsafeLocalizedString(''),
    disabled: false
  }
}
