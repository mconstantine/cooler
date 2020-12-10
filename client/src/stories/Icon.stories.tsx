import { Meta, Story } from '@storybook/react'
import {
  airplane,
  airplaneOutline,
  airplaneSharp,
  checkmark,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkCircleSharp,
  heart,
  heartCircle,
  heartCircleOutline,
  heartCircleSharp,
  skull,
  skullOutline,
  skullSharp,
  warning,
  warningOutline,
  warningSharp
} from 'ionicons/icons'
import { Content } from '../components/Content/Content'
import { Icon as IconComponent } from '../components/Icon/Icon'
import { Separator } from '../components/Separator/Separator'
import { CoolerStory } from './CoolerStory'

export const Icon: Story = () => (
  <CoolerStory>
    <Content>
      <h4>Default icons</h4>
      <IconComponent src={heart} />
      <IconComponent src={heartCircle} />
      <IconComponent src={heartCircleOutline} />
      <IconComponent src={heartCircleSharp} />

      <Separator />

      <h4>Primary icons</h4>
      <IconComponent color="primary" src={airplane} />
      <IconComponent color="primary" src={airplaneOutline} />
      <IconComponent color="primary" src={airplaneSharp} />

      <Separator />

      <h4>Success icons</h4>
      <IconComponent color="success" src={checkmark} />
      <IconComponent color="success" src={checkmarkCircle} />
      <IconComponent color="success" src={checkmarkCircleOutline} />
      <IconComponent color="success" src={checkmarkCircleSharp} />

      <Separator />

      <h4>Warning icons</h4>
      <IconComponent color="warning" src={warning} />
      <IconComponent color="warning" src={warningOutline} />
      <IconComponent color="warning" src={warningSharp} />

      <Separator />

      <h4>Danger icons</h4>
      <IconComponent color="danger" src={skull} />
      <IconComponent color="danger" src={skullOutline} />
      <IconComponent color="danger" src={skullSharp} />
    </Content>
  </CoolerStory>
)

const meta: Meta = {
  title: 'Cooler/Icon'
}

export default meta
