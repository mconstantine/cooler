import { Meta, StoryObj } from '@storybook/react'
import { option } from 'fp-ts'
import { unsafeLocalizedString } from '../a18n'
import { Body } from '../components/Body/Body'
import { Content } from '../components/Content/Content'
import { Heading } from '../components/Heading/Heading'
import { Panel } from '../components/Panel/Panel'

const meta: Meta<typeof Heading> = {
  title: 'Cooler/Typography'
}
export default meta
type Story = StoryObj<typeof Heading>

export const Headings: Story = {
  render: () => (
    <Content>
      <Panel framed actions={option.none}>
        <Heading size={40} actions={option.none}>
          {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
        </Heading>
      </Panel>
      <Panel framed actions={option.none}>
        <Heading size={36} actions={option.none}>
          {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
        </Heading>
      </Panel>
      <Panel framed actions={option.none}>
        <Heading size={32} actions={option.none}>
          {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
        </Heading>
      </Panel>
      <Panel framed actions={option.none}>
        <Heading size={27} actions={option.none}>
          {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
        </Heading>
      </Panel>
      <Panel framed actions={option.none}>
        <Heading size={24} actions={option.none}>
          {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
        </Heading>
      </Panel>
      <Panel framed actions={option.none}>
        <Heading size={21} actions={option.none}>
          {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
        </Heading>
      </Panel>
    </Content>
  )
}

export const Mix: Story = {
  render: () => (
    <Content>
      <Heading size={40} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <Body>
        {unsafeLocalizedString(
          'Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat, quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia molestiae repudiandae, voluptas placeat veniam in quas at rem rerum fugiat.'
        )}
      </Body>

      <Heading size={36} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <Body>
        {unsafeLocalizedString(
          'Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat, quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia molestiae repudiandae, voluptas placeat veniam in quas at rem rerum fugiat.'
        )}
      </Body>

      <Heading size={32} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <Body>
        {unsafeLocalizedString(
          'Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat, quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia molestiae repudiandae, voluptas placeat veniam in quas at rem rerum fugiat.'
        )}
      </Body>

      <Heading size={27} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <Body>
        {unsafeLocalizedString(
          'Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat, quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia molestiae repudiandae, voluptas placeat veniam in quas at rem rerum fugiat.'
        )}
      </Body>

      <Heading size={24} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <Body>
        {unsafeLocalizedString(
          'Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat, quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia molestiae repudiandae, voluptas placeat veniam in quas at rem rerum fugiat.'
        )}
      </Body>

      <Heading size={21} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <Body>
        {unsafeLocalizedString(
          'Libero modi amet asperiores? Laudantium sapiente, quos itaque earum, non voluptas facilis aliquid odio qui doloribus est veniam? Iusto repellat, quae impedit ipsam nam cumque esse libero atque dolor doloribus mollitia molestiae repudiandae, voluptas placeat veniam in quas at rem rerum fugiat.'
        )}
      </Body>

      <Heading size={40} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <Heading size={36} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <p></p>
      <Heading size={32} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <Heading size={27} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <p></p>
      <Heading size={24} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
      <Heading size={21} actions={option.none}>
        {unsafeLocalizedString('Lorem ipsum, dolor sit amet')}
      </Heading>
    </Content>
  )
}
