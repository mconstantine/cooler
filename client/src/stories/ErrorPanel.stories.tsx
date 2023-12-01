import { Meta, StoryObj } from '@storybook/react'
import { unsafeLocalizedString } from '../a18n'
import { Content } from '../components/Content/Content'
import { ErrorPanel } from '../components/ErrorPanel/ErrorPanel'

const meta: Meta<typeof ErrorPanel> = {
  title: 'Cooler/ErrorPanel',
  component: ErrorPanel,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    error: {
      name: 'Error message',
      control: 'text'
    }
  }
}

export default meta
type Story = StoryObj<typeof ErrorPanel>

export const ErrorPanelTemplate: Story = {
  render: props => {
    return (
      <Content>
        <ErrorPanel error={props.error} />
      </Content>
    )
  },
  args: {
    error: unsafeLocalizedString(
      'An unexpected error occurred, please try again later'
    )
  }
}
