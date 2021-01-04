import { Meta, Story } from '@storybook/react'
import { Content } from '../../../components/Content/Content'
import { Panel } from '../../../components/Panel/Panel'
import { EntityPicker as EntityPickerComponent } from '../../../components/Form/Input/EntityPicker/EntityPicker'
import { CoolerStory } from '../../CoolerStory'

export const EntityPicker: Story = () => {
  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <EntityPickerComponent />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Entity Picker'
}

export default meta
