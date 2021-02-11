import { Meta, Story } from '@storybook/react'
import { App as AppComponent } from '../App'

interface Args {}

const AppTemplate: Story<Args> = () => {
  return <AppComponent />
}

export const App = AppTemplate.bind({})

App.args = {}
App.argTypes = {}

const meta: Meta = {
  title: 'Cooler/App'
}

export default meta
