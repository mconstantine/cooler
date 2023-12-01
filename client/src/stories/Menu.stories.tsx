import { Meta, StoryObj } from '@storybook/react'
import { Content } from '../components/Content/Content'
import { Menu } from '../components/Menu/Menu'

const meta: Meta<typeof Menu> = {
  title: 'Cooler/Menu',
  component: Menu,
  parameters: {},
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof Menu>

export const Default: Story = {
  render: () => {
    return (
      <Content>
        <Menu />
      </Content>
    )
  }
}
