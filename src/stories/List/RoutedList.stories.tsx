import { Meta, Story } from '@storybook/react'
import { boolean, either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { List } from '../../components/List/List'
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
  details: boolean
  action: (index: number) => void
}

const RoutedListTemplate: Story<Args> = props => {
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
            type: 'routed',
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
            details: props.details,
            action: () => props.action(index)
          }))}
          emptyListMessage={unsafeLocalizedString('No items found')}
        />
      </Content>
    </CoolerStory>
  )
}

export const RoutedList = RoutedListTemplate.bind({})

RoutedList.args = {
  ...defaultArgs,
  details: true
}

RoutedList.argTypes = {
  ...defaultArgTypes,
  details: {
    name: 'Details Icon',
    control: 'boolean'
  },
  action: {
    action: 'click'
  }
}

const meta: Meta<DefaultArgs> = {
  title: 'Cooler/List/Routed List'
}

export default meta
