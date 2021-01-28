import { Meta, Story } from '@storybook/react'
import { boolean, either, option } from 'fp-ts'
import { pipe } from 'fp-ts/lib/pipeable'
import { NonEmptyString } from 'io-ts-types'
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

const ReadonlyListTemplate: Story<DefaultArgs> = props => {
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
            type: 'readonly',
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
            size: props.size
          }))}
        />
      </Content>
    </CoolerStory>
  )
}

export const ReadonlyList = ReadonlyListTemplate.bind({})

ReadonlyList.args = { ...defaultArgs }
ReadonlyList.argTypes = { ...defaultArgTypes }

const meta: Meta<DefaultArgs> = {
  title: 'Cooler/List/Readonly List'
}

export default meta
