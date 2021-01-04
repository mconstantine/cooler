import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { useState } from 'react'
import { unsafeLocalizedString, localizedMonthNames } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { CounterSelect as CounterSelectComponent } from '../../../components/Form/Input/CounterSelect/CounterSelect'
import { Panel } from '../../../components/Panel/Panel'
import { CoolerStory } from '../../CoolerStory'

export const CounterSelect: Story = () => {
  const [state, setState] = useState('0')

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <CounterSelectComponent
            name="counterSelect"
            label={unsafeLocalizedString('Label')}
            value={state}
            onChange={setState}
            options={localizedMonthNames}
            error={option.none}
            warning={option.none}
            onBack={n => n - 1}
            onForward={n => n + 1}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/CounterSelect'
}

export default meta
