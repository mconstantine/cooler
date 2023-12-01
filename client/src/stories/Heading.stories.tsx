import { Meta, StoryObj } from '@storybook/react'
import { nonEmptyArray, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { unsafeLocalizedString } from '../a18n'
import { Body } from '../components/Body/Body'
import { Content } from '../components/Content/Content'
import { Heading, HeadingSize } from '../components/Heading/Heading'
import { colorControl } from './args'
import { ComponentProps } from 'react'
import { LocalizedString } from '../globalDomain'

interface HeadingStoryArgs extends ComponentProps<typeof Heading> {
  actionLabel: LocalizedString
}

const meta: Meta<HeadingStoryArgs> = {
  title: 'Cooler/Heading',
  component: Heading,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    size: {
      name: 'Size',
      control: {
        type: 'select',
        options: {
          40: 40,
          36: 36,
          32: 32,
          27: 27,
          24: 24,
          21: 21
        } as Record<string, HeadingSize>
      }
    },
    color: {
      name: 'Color',
      control: colorControl
    },
    actionLabel: {
      name: 'Action label',
      control: 'text'
    }
  }
}

export default meta
type Story = StoryObj<HeadingStoryArgs>

export const Default: Story = {
  render: props => {
    return (
      <Content>
        <Heading
          size={props.size}
          color={props.color}
          actions={pipe(
            props.actionLabel,
            NonEmptyString.decode,
            option.fromEither,
            option.map(label =>
              nonEmptyArray.of({
                type: 'sync',
                label: unsafeLocalizedString(label),
                action: constVoid,
                icon: option.none
              })
            )
          )}
        >
          {unsafeLocalizedString('Lorem ipsum dolor sit amet.')}
        </Heading>
        <Body color={props.color}>
          {unsafeLocalizedString(
            'Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias exercitationem accusamus impedit at assumenda deserunt dignissimos itaque inventore vero ullam consequuntur, voluptatem ipsam nobis corrupti nisi cupiditate. Doloribus, amet earum?'
          )}
        </Body>
      </Content>
    )
  },
  args: {
    size: 40,
    color: 'default',
    actionLabel: unsafeLocalizedString('Action')
  }
}
