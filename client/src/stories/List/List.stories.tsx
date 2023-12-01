import { Meta, StoryObj } from '@storybook/react'
import { List } from '../../components/List/List'
import {
  DefaultArgs,
  contents,
  defaultArgs,
  defaultArgTypes,
  description,
  labels
} from './args'
import { Content } from '../../components/Content/Content'
import { constVoid, pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { boolean, either, option, readerTaskEither } from 'fp-ts'
import { formatNumber, unsafeLocalizedString } from '../../a18n'
import { heart, send } from 'ionicons/icons'
import { colorControl } from '../args'
import { Color, unsafePercentage } from '../../globalDomain'

const meta: Meta<typeof List> = {
  title: 'Cooler/List',
  component: List,
  parameters: {},
  tags: ['autodocs'],
  argTypes: defaultArgTypes
}

export default meta
type ListWithButtonsStory = StoryObj<DefaultArgs>

export const WithButtons: ListWithButtonsStory = {
  render: props => {
    return (
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
            type: 'withButtons',
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
            buttons: [
              {
                type: 'button',
                label: unsafeLocalizedString('Button label'),
                icon: option.none,
                action: constVoid
              },
              {
                type: 'iconButton',
                icon: heart,
                action: constVoid
              },
              {
                type: 'loadingButton',
                label: option.some(unsafeLocalizedString('Button label')),
                icon: send,
                action: readerTaskEither.fromIO(constVoid)
              }
            ]
          }))}
          emptyListMessage={unsafeLocalizedString('No items found')}
        />
      </Content>
    )
  },
  argTypes: defaultArgTypes,
  args: defaultArgs
}

interface ListWithValuesArgs extends DefaultArgs {
  value: number
  color: Color
  progress: boolean
}
type ListWithValuesStory = StoryObj<ListWithValuesArgs>

export const WithValues: ListWithValuesStory = {
  render: props => {
    return (
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
          emptyListMessage={unsafeLocalizedString('No items found')}
        />
      </Content>
    )
  },
  argTypes: {
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
  },
  args: {
    ...defaultArgs,
    value: 50,
    color: 'default',
    progress: false
  }
}

type ReadonlyListWithButtonsStory = StoryObj<DefaultArgs>

export const Readonly: ReadonlyListWithButtonsStory = {
  render: props => {
    return (
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
          emptyListMessage={unsafeLocalizedString('No items found')}
        />
      </Content>
    )
  },
  argTypes: defaultArgTypes,
  args: defaultArgs
}

type Position = 'start' | 'end'

interface ReadonlyListWithIconsArgs extends DefaultArgs {
  iconPosition: Position
  iconColor: Color
}

type ReadonlyListWithIconsStory = StoryObj<ReadonlyListWithIconsArgs>

export const ReadonlyListWithIcons: ReadonlyListWithIconsStory = {
  render: props => {
    return (
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
          emptyListMessage={unsafeLocalizedString('No items found')}
        />
      </Content>
    )
  },
  argTypes: {
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
  },
  args: {
    ...defaultArgs,
    iconPosition: 'start',
    iconColor: 'default'
  }
}

interface RoutedListTemplateArgs extends DefaultArgs {
  details: boolean
  action: (index: number) => void
}

type RoutedListStory = StoryObj<RoutedListTemplateArgs>

export const RoutedListTemplate: RoutedListStory = {
  render: props => {
    return (
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
    )
  },
  argTypes: {
    ...defaultArgTypes,
    details: {
      name: 'Details Icon',
      control: 'boolean'
    },
    action: {
      action: 'click'
    }
  },
  args: {
    ...defaultArgs,
    details: true
  }
}

interface RoutedListWithIconsArgs extends DefaultArgs {
  iconColor: Color
  details: boolean
  action: (index: number) => void
}

type RoutedListWithIconsStory = StoryObj<RoutedListWithIconsArgs>

export const RoutedListWithIconsTemplate: RoutedListWithIconsStory = {
  render: props => {
    return (
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
          emptyListMessage={unsafeLocalizedString('No items found')}
        />
      </Content>
    )
  },
  args: {
    ...defaultArgs,
    iconColor: 'default',
    details: true
  },
  argTypes: {
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
}
