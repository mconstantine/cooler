import { Meta, Story } from '@storybook/react'
import { Content } from '../components/Content/Content'
import { Menu as MenuComponent } from '../components/Menu/Menu'
import { CoolerStory } from './CoolerStory'

interface Args {}

const MenuTemplate: Story<Args> = () => {
  return (
    <CoolerStory>
      <Content>
        <MenuComponent />
      </Content>
    </CoolerStory>
  )
}

export const Menu = MenuTemplate.bind({})

Menu.args = {}
Menu.argTypes = {}

const meta: Meta = {
  title: 'Cooler/Menu'
}

export default meta
