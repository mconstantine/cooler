import { Meta, Story } from '@storybook/react'
import { Content } from '../components/Content/Content'
import { Loading as LoadingComponent } from '../components/Loading/Loading'
import { Color, Size } from '../globalDomain'
import { colorControl, sizeControl } from './args'
import { CoolerStory } from './CoolerStory'

interface Args {
  color: Color
  size: Size
}

export const Loading: Story<Args> = props => {
  return (
    <CoolerStory>
      <Content>
        <LoadingComponent color={props.color} size={props.size} />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta<Args> = {
  title: 'Cooler/Loading',
  args: {
    color: 'default',
    size: 'medium'
  },
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
