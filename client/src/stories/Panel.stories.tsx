import { Meta, Story } from '@storybook/react'
import { boolean, either, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { heart } from 'ionicons/icons'
import { unsafeLocalizedString } from '../a18n'
import { Body } from '../components/Body/Body'
import { Content } from '../components/Content/Content'
import { HeadingAction } from '../components/Heading/Heading'
import { Panel as PanelComponent } from '../components/Panel/Panel'
import { LocalizedString } from '../globalDomain'
import { CoolerStory } from './CoolerStory'

interface Args {
  title: LocalizedString
  framed: boolean
  actionLabel: LocalizedString
  actionIcon: boolean
}

const PanelTemplate: Story<Args> = props => (
  <CoolerStory>
    <Content>
      <PanelComponent
        title={props.title}
        framed={props.framed}
        action={option.some(
          pipe(
            props.actionLabel,
            NonEmptyString.decode,
            either.fold(
              () =>
                ({
                  type: 'icon',
                  action: constVoid,
                  icon: heart
                } as HeadingAction),
              label => ({
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
      </PanelComponent>
    </Content>
  </CoolerStory>
)

export const Panel = PanelTemplate.bind({})

Panel.args = {
  title: unsafeLocalizedString('Title'),
  framed: true,
  actionLabel: unsafeLocalizedString('Action'),
  actionIcon: true
}

Panel.argTypes = {
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
  }
}

const meta: Meta = {
  title: 'Cooler/Panel'
}

export default meta
