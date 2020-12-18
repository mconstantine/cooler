import { Meta, Story } from '@storybook/react'
import { unsafeLocalizedString } from '../a18n'
import { Content } from '../components/Content/Content'
import { Panel as PanelComponent } from '../components/Panel/Panel'
import { CoolerStory } from './CoolerStory'

export const Panel: Story = () => (
  <CoolerStory>
    <Content>
      <PanelComponent title={unsafeLocalizedString('Title')}>
        <p>
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Veritatis,
          eos omnis iure ex ab optio amet provident voluptates id dicta
          consequatur aliquid? Magni, enim repudiandae iste tempora cum
          pariatur.
        </p>
      </PanelComponent>
    </Content>
  </CoolerStory>
)

const meta: Meta = {
  title: 'Cooler/Panel'
}

export default meta
