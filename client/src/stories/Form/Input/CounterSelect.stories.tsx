import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { unsafeLocalizedString, localizedMonthNames } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { CounterSelect as CounterSelectComponent } from '../../../components/Form/Input/CounterSelect/CounterSelect'
import { useSelectState } from '../../../components/Form/Input/Select/Select'
import { Panel } from '../../../components/Panel/Panel'
import { CoolerStory } from '../../CoolerStory'
import * as t from 'io-ts'
import { IntFromString } from 'io-ts-types'

export const CounterSelect: Story = () => {
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
            label={unsafeLocalizedString('Label')}
            codec={IntFromString}
            value={state}
            onChange={setState}
            options={localizedMonthNames}
            error={option.none}
            warning={option.none}
            onBack={n => (n - 1) as t.Int}
            onForward={n => (n + 1) as t.Int}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Counter Select'
}

export default meta
