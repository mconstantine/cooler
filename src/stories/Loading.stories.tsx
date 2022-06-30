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

const LoadingTemplate: Story<Args> = props => {
  return (
    <CoolerStory>
      <Content>
        <LoadingComponent color={props.color} size={props.size} />
      </Content>
    </CoolerStory>
  )
}

export const Loading = LoadingTemplate.bind({})

Loading.args = {
  color: 'default',
  size: 'medium'
}

Loading.argTypes = {
  color: {
    control: colorControl
  },
  size: {
    control: sizeControl
  }
}

const meta: Meta<Args> = {
  title: 'Cooler/Loading'
}

export default meta
