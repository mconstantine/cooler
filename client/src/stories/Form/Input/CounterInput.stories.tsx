import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { CounterInput as CounterInputComponent } from '../../../components/Form/Input/CounterInput/CounterInput'
import { Panel } from '../../../components/Panel/Panel'
import { CoolerStory } from '../../CoolerStory'

export const CounterInput: Story = () => {
  const [value, setValue] = useState('100')

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <CounterInputComponent
            name="counterInput"
            label={unsafeLocalizedString('Label')}
            value={value}
            onChange={setValue}
            onBack={value => value - 1}
            onForward={value => value + 1}
            error={option.none}
            warning={option.none}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Counter Input'
}

export default meta
