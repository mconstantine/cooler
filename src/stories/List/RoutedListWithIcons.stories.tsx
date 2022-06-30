import { Meta, Story } from '@storybook/react'
import { boolean, either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
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

interface Args extends DefaultArgs {
  iconColor: Color
  details: boolean
  action: (index: number) => void
}

const RoutedListWithIconsTemplate: Story<Args> = props => {
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
            type: 'routedWithIcon',
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
            iconColor: props.iconColor,
            details: props.details,
            action: () => props.action(index)
          }))}
        />
      </Content>
    </CoolerStory>
  )
}

export const RoutedListWithIcons = RoutedListWithIconsTemplate.bind({})

RoutedListWithIcons.args = {
  ...defaultArgs,
  iconColor: 'default',
  details: true
}

RoutedListWithIcons.argTypes = {
  ...defaultArgTypes,
  iconColor: {
    name: 'Icons color',
    control: colorControl
  },
  details: {
    name: 'Details Icon',
    control: 'boolean'
  },
  action: {
    action: 'click'
  }
}

const meta: Meta<DefaultArgs> = {
  title: 'Cooler/List/Routed List With Icons'
}

export default meta
