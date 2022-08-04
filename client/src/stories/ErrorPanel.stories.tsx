import { Meta, Story } from '@storybook/react'
import { unsafeLocalizedString } from '../a18n'
import { Content } from '../components/Content/Content'
import { ErrorPanel as ErrorPanelComponent } from '../components/ErrorPanel/ErrorPanel'
import { LocalizedString } from '../globalDomain'
import { CoolerStory } from './CoolerStory'

interface Args {
  error: LocalizedString
}

const ErrorPanelTemplate: Story<Args> = props => {
  return (
    <CoolerStory>
      <Content>
        <ErrorPanelComponent error={props.error} />
      </Content>
    </CoolerStory>
  )
}

export const ErrorPanel = ErrorPanelTemplate.bind({})

ErrorPanel.args = {
  error: unsafeLocalizedString(
    'An unexpected error occurred, please try again later'
  )
}

ErrorPanel.argTypes = {
  error: {
    name: 'Error message',
    control: 'text'
  }
}

const meta: Meta = {
  title: 'Cooler/Error Panel'
}

export default meta
