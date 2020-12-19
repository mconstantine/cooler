import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { NumberInput as NumberInputComponent } from '../../../components/Form/Input/NumberInput/NumberInput'
import { Panel } from '../../../components/Panel/Panel'
import { CoolerStory } from '../../CoolerStory'

export const NumberInput: Story = () => {
  const [numberInputValue, setNumberInputValue] = useState('')

  return (
    <CoolerStory>
      <Content>
        <Panel>
          <NumberInputComponent
            value={numberInputValue}
            onChange={setNumberInputValue}
            label={unsafeLocalizedString('Number Input')}
            name="number-input"
            error={option.none}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/NumberInput'
}

export default meta
