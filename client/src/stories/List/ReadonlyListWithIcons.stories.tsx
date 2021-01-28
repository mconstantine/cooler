import { Meta, Story } from '@storybook/react'
import { boolean, either, option } from 'fp-ts'
import { pipe } from 'fp-ts/lib/pipeable'
import { NonEmptyString } from 'io-ts-types'
import { heart } from 'ionicons/icons'
import { Content } from '../../components/Content/Content'
import { List } from '../../components/List/List'
import { Color } from '../../globalDomain'
import { colorControl } from '../args'
import { CoolerStory } from '../CoolerStory'
import {
  contents,
  defaultArgs,
  DefaultArgs,
  defaultArgTypes,
  description,
  labels
} from './args'

type Position = 'start' | 'end'

interface Args extends DefaultArgs {
  iconPosition: Position
  iconColor: Color
}

const ReadonlyListWithIconsTemplate: Story<Args> = props => {
  return (
    <CoolerStory>
      <Content>
        <List
          heading={pipe(
            props.heading,
            NonEmptyString.decode,
            either.fold(
              () => option.none,
              () => option.some(props.heading)
            )
          )}
          unwrapDescriptions={props.unwrapDescriptions}
          items={new Array(props.itemsCount).fill(null).map((_, index) => ({
            key: index,
            type: 'readonlyWithIcon',
            label: pipe(
              props.hasLabel,
              boolean.fold(
                () => option.none,
                () => option.some(labels[index])
              )
            ),
            content: contents[index],
            description: pipe(
              props.hasDescription,
              boolean.fold(
                () => option.none,
                () => option.some(description)
              )
            ),
            size: props.size,
            icon: heart,
            iconPosition: props.iconPosition,
            iconColor: props.iconColor
          }))}
        />
      </Content>
    </CoolerStory>
  )
}

export const ReadonlyListWithIcons = ReadonlyListWithIconsTemplate.bind({})

ReadonlyListWithIcons.args = {
  ...defaultArgs,
  iconPosition: 'start',
  iconColor: 'default'
}

ReadonlyListWithIcons.argTypes = {
  ...defaultArgTypes,
  iconPosition: {
    name: 'Icons position',
    control: {
      type: 'select',
      options: {
        Start: 'start',
        End: 'end'
      } as Record<string, Position>
    }
  },
  iconColor: {
    name: 'Icons color',
    control: colorControl
  }
}

const meta: Meta<DefaultArgs> = {
  title: 'Cooler/List/Readonly List With Icons'
}

export default meta
