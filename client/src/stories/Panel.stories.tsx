import { Meta, Story } from '@storybook/react'
import { Panel } from '../components/Panel/Panel'
import { CoolerStory } from './CoolerStory'

export const Default: Story = () => (
  <CoolerStory>
    <Panel>
      <p>
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Veritatis, eos
        omnis iure ex ab optio amet provident voluptates id dicta consequatur
        aliquid? Magni, enim repudiandae iste tempora cum pariatur.
      </p>
    </Panel>
  </CoolerStory>
)

const meta: Meta = {
  title: 'Cooler/Panel',
  component: Default
}

export default meta
