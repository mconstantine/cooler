import { Meta, Story } from '@storybook/react'
import { boolean, either, option, readerTaskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { heart, send } from 'ionicons/icons'
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

const ListWithButtonsTemplate: Story<DefaultArgs> = props => {
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
                action: () => {}
              },
              {
                type: 'iconButton',
                icon: heart,
                action: () => {}
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
    </CoolerStory>
  )
}

export const ListWithButtons = ListWithButtonsTemplate.bind({})

ListWithButtons.args = { ...defaultArgs }
ListWithButtons.argTypes = { ...defaultArgTypes }

const meta: Meta<DefaultArgs> = {
  title: 'Cooler/List/List With Buttons'
}

export default meta
