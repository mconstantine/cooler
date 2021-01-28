import { Meta, Story } from '@storybook/react'
import { heart } from 'ionicons/icons'
import { Content } from '../components/Content/Content'
import { Icon as IconComponent } from '../components/Icon/Icon'
import { Color, Size } from '../globalDomain'
import { colorControl, sizeControl } from './args'
import { CoolerStory } from './CoolerStory'

interface Args {
  color: Color
  size: Size
}

const IconTemplate: Story<Args> = props => (
  <CoolerStory>
    <Content>
      <IconComponent src={heart} color={props.color} size={props.size} />
    </Content>
  </CoolerStory>
)

export const Icon = IconTemplate.bind({})

Icon.args = {
  color: 'default',
  size: 'large'
}

Icon.argTypes = {
  color: {
    name: 'Color',
    control: colorControl
  },
  size: {
    name: 'Size',
    control: sizeControl
  }
}

const meta: Meta = {
  title: 'Cooler/Icon'
}

export default meta
