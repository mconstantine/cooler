import { Meta, StoryObj } from '@storybook/react'
import { heart } from 'ionicons/icons'
import { Content } from '../components/Content/Content'
import { Icon } from '../components/Icon/Icon'
import { colorControl, sizeControl } from './args'

const meta: Meta<typeof Icon> = {
  title: 'Cooler/Icon',
  component: Icon,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    color: {
      name: 'Color',
      control: colorControl
    },
    size: {
      name: 'Size',
      control: sizeControl
    }
  }
}

export default meta
type Story = StoryObj<typeof Icon>

export const Default: Story = {
  render: props => (
    <Content>
      <Icon src={heart} color={props.color} size={props.size} />
    </Content>
  ),
  args: {
    color: 'default',
    size: 'large'
  }
}
