import { Meta, StoryObj } from '@storybook/react'
import { boolean, either, nonEmptyArray, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { heart } from 'ionicons/icons'
import { unsafeLocalizedString } from '../a18n'
import { Body } from '../components/Body/Body'
import { Content } from '../components/Content/Content'
import { HeadingAction } from '../components/Heading/Heading'
import { Panel } from '../components/Panel/Panel'
import { colorControl } from './args'
import { ComponentProps } from 'react'
import { LocalizedString } from '../globalDomain'

interface PanelStoryProps extends ComponentProps<typeof Panel> {
  actionLabel: LocalizedString
  actionIcon: boolean
}

const meta: Meta<PanelStoryProps> = {
  title: 'Cooler/Panel',
  component: Panel,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    title: {
      name: 'Title',
      control: 'text'
    },
    framed: {
      name: 'Show frame',
      control: 'boolean'
    },
    actionLabel: {
      name: 'Action label',
      control: 'text'
    },
    actionIcon: {
      name: 'Action icon',
      control: 'boolean'
    },
    color: {
      name: 'Color',
      control: colorControl
    }
  },
  args: {
    title: unsafeLocalizedString('Title'),
    framed: true,
    actionLabel: unsafeLocalizedString('Action'),
    actionIcon: true,
    color: 'default'
  }
}

export default meta
type Story = StoryObj<PanelStoryProps>

export const Default: Story = {
  render: props => (
    <Content>
      <Panel
        title={props.title}
        framed={props.framed}
        color={props.color}
        actions={option.some(
          pipe(
            props.actionLabel,
            NonEmptyString.decode,
            either.fold(
              () =>
                nonEmptyArray.of({
                  type: 'icon',
                  action: constVoid,
                  icon: heart
                } as HeadingAction),
              label =>
                nonEmptyArray.of({
                  type: 'sync',
                  label: unsafeLocalizedString(label),
                  action: constVoid,
                  icon: pipe(
                    props.actionIcon,
                    boolean.fold(
                      () => option.none,
                      () => option.some(heart)
                    )
                  )
                })
            )
          )
        )}
      >
        <Body>
          {unsafeLocalizedString(
            'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Veritatis, eos omnis iure ex ab optio amet provident voluptates id dicta consequatur aliquid? Magni, enim repudiandae iste tempora cum pariatur.'
          )}
        </Body>
      </Panel>
    </Content>
  )
}
