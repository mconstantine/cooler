import { Meta, Story } from '@storybook/react'
import { unsafeLocalizedString } from '../a18n'
import { Content } from '../components/Content/Content'
import { Panel as PanelComponent } from '../components/Panel/Panel'
import { LocalizedString } from '../globalDomain'
import { CoolerStory } from './CoolerStory'

interface Args {
  title: LocalizedString
  framed: boolean
}

const PanelTemplate: Story<Args> = props => (
  <CoolerStory>
    <Content>
      <PanelComponent title={props.title} framed={props.framed}>
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

export const Panel = PanelTemplate.bind({})

Panel.args = {
  title: unsafeLocalizedString('Title'),
  framed: true
}

Panel.argTypes = {
  title: {
    name: 'Title',
    control: 'text'
  },
  framed: {
    name: 'Show frame',
    control: 'boolean'
  }
}

const meta: Meta = {
  title: 'Cooler/Panel'
}

export default meta
