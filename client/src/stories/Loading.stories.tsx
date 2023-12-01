import { Meta, StoryObj } from '@storybook/react'
import { Content } from '../components/Content/Content'
import { Loading } from '../components/Loading/Loading'
import { colorControl, sizeControl } from './args'

const meta: Meta<typeof Loading> = {
  title: 'Cooler/Loading',
  component: Loading,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: colorControl
    },
    size: {
      control: sizeControl
    }
  }
}

export default meta
type Story = StoryObj<typeof Loading>

export const LoadingTemplate: Story = {
  render: props => {
    return (
      <Content>
        <Loading color={props.color} size={props.size} />
      </Content>
    )
  },
  args: {
    color: 'default',
    size: 'medium'
  }
}
