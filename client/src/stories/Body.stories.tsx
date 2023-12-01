import { Meta, StoryObj } from '@storybook/react'
import { Body, TextEmphasis } from '../components/Body/Body'
import { colorControl } from './args'
import { Content } from '../components/Content/Content'
import { unsafeLocalizedString } from '../a18n'

const meta: Meta<typeof Body> = {
  title: 'Cooler/Body',
  component: Body,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    color: {
      name: 'Color',
      control: colorControl
    },
    emphasis: {
      name: 'Text emphasis',
      control: {
        type: 'select',
        options: {
          Full: 'full',
          High: 'high',
          Medium: 'medium',
          Low: 'low'
        } as Record<string, TextEmphasis>
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof Body>

export const Default: Story = {
  args: {
    color: 'default',
    emphasis: 'full'
  },
  render: props => (
    <Content>
      <Body color={props.color} emphasis={props.emphasis}>
        {unsafeLocalizedString(
          'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Odio voluptatem dicta pariatur nobis recusandae maiores fugiat eveniet suscipit, fugit reiciendis, earum saepe. Reprehenderit laboriosam debitis vero eos doloribus qui aspernatur tenetur vitae pariatur perspiciatis omnis, incidunt quae consectetur sapiente rerum! Aut voluptatibus cumque impedit, rem vel adipisci laboriosam quos voluptate?'
        )}
      </Body>
    </Content>
  )
}
