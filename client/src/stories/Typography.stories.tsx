import { Meta, Story } from '@storybook/react'
import { Content } from '../components/Content/Content'
import { Panel } from '../components/Panel/Panel'
import { CoolerStory } from './CoolerStory'

export const Headings: Story = () => (
  <CoolerStory>
    <Content>
      <Panel framed>
        <h1>Lorem ipsum, dolor sit amet</h1>
      </Panel>
      <Panel framed>
        <h2>Lorem ipsum, dolor sit amet</h2>
      </Panel>
      <Panel framed>
        <h3>Lorem ipsum, dolor sit amet</h3>
      </Panel>
      <Panel framed>
        <h4>Lorem ipsum, dolor sit amet</h4>
      </Panel>
      <Panel framed>
        <h5>Lorem ipsum, dolor sit amet</h5>
      </Panel>
      <Panel framed>
        <h6>Lorem ipsum, dolor sit amet</h6>
      </Panel>
    </Content>
  </CoolerStory>
)

export const Mix: Story = () => (
  <CoolerStory>
    <Content>
      <h1>Lorem ipsum, dolor sit amet</h1>
      <p>
        Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non
        voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat,
        quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia
        molestiae repudiandae, voluptas placeat veniam in quas at rem rerum
        fugiat.
      </p>

      <h2>Lorem ipsum, dolor sit amet</h2>
      <p>
        Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non
        voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat,
        quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia
        molestiae repudiandae, voluptas placeat veniam in quas at rem rerum
        fugiat.
      </p>

      <h3>Lorem ipsum, dolor sit amet</h3>
      <p>
        Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non
        voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat,
        quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia
        molestiae repudiandae, voluptas placeat veniam in quas at rem rerum
        fugiat.
      </p>

      <h4>Lorem ipsum, dolor sit amet</h4>
      <p>
        Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non
        voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat,
        quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia
        molestiae repudiandae, voluptas placeat veniam in quas at rem rerum
        fugiat.
      </p>

      <h5>Lorem ipsum, dolor sit amet</h5>
      <p>
        Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non
        voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat,
        quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia
        molestiae repudiandae, voluptas placeat veniam in quas at rem rerum
        fugiat.
      </p>

      <h6>Lorem ipsum, dolor sit amet</h6>
      <p>
        Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non
        voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat,
        quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia
        molestiae repudiandae, voluptas placeat veniam in quas at rem rerum
        fugiat.
      </p>

      <h1>Lorem ipsum, dolor sit amet</h1>
      <h2>Lorem ipsum, dolor sit amet</h2>
      <p></p>
      <h3>Lorem ipsum, dolor sit amet</h3>
      <h4>Lorem ipsum, dolor sit amet</h4>
      <p></p>
      <h5>Lorem ipsum, dolor sit amet</h5>
      <h6>Lorem ipsum, dolor sit amet</h6>
    </Content>
  </CoolerStory>
)

const meta: Meta = {
  title: 'Cooler/Typography',
  component: Headings
}

export default meta
