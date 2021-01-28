import { Meta, Story } from '@storybook/react'
import { boolean, either, option } from 'fp-ts'
import { pipe } from 'fp-ts/lib/pipeable'
import { NonEmptyString } from 'io-ts-types'
import { formatNumber } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { List } from '../../components/List/List'
import { Color, unsafePercentage } from '../../globalDomain'
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
  value: number
  color: Color
  progress: boolean
}

const ListWithValuesTemplate: Story<Args> = props => {
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
          items={new Array(props.itemsCount).fill(null).map((_, index) => {
            const value = (props.value / props.itemsCount) * (index + 1)

            return {
              key: index,
              type: 'valued',
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
              value: formatNumber(value),
              progress: pipe(
                props.progress,
                boolean.fold(
                  () => option.none,
                  () => option.some(unsafePercentage(value / 100))
                )
              ),
              valueColor: props.color
            }
          })}
        />
      </Content>
    </CoolerStory>
  )
}

export const ListWithValues = ListWithValuesTemplate.bind({})

ListWithValues.args = {
  ...defaultArgs,
  value: 50,
  color: 'default',
  progress: false
}

ListWithValues.argTypes = {
  ...defaultArgTypes,
  value: {
    name: 'Base value',
    description: 'The last item in the list will have this value',
    control: {
      type: 'range',
      min: 0,
      max: 100
    }
  },
  color: {
    name: 'Color',
    control: colorControl
  },
  progress: {
    name: 'Show progress bars',
    control: 'boolean'
  }
}

const meta: Meta<DefaultArgs> = {
  title: 'Cooler/List/List With Values'
}

export default meta
