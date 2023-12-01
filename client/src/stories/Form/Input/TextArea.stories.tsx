import { Meta, StoryObj } from '@storybook/react'
import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { ComponentProps, useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { TextArea } from '../../../components/Form/Input/TextArea/TextArea'
import { Panel } from '../../../components/Panel/Panel'
import { LocalizedString } from '../../../globalDomain'

interface TextAreaStoryArgs
  extends Omit<ComponentProps<typeof TextArea>, 'error' | 'warning'> {
  error: LocalizedString
  warning: LocalizedString
  emptyPlaceholder: LocalizedString
}

const meta: Meta<TextAreaStoryArgs> = {
  title: 'Cooler/Forms/Input/TextArea',
  component: TextArea as any,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    label: {
      name: 'Label',
      control: 'text'
    },
    error: {
      name: 'Error',
      control: 'text'
    },
    warning: {
      name: 'Warning',
      control: 'text'
    },
    disabled: {
      name: 'Disabled',
      control: 'boolean'
    }
  }
}

export default meta
type Story = StoryObj<TextAreaStoryArgs>

export const Default: Story = {
  render: function Story(props) {
    const [content, setContent] = useState(
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor amet ipsam minus quisquam tempore nisi iste deserunt eveniet culpa expedita quibusdam veniam quis repellat, deleniti alias facilis cum at provident laborum dicta accusamus doloribus.\nLabore, adipisci. Explicabo beatae impedit dolore fugit nulla architecto ducimus, eum deleniti cum suscipit numquam quos.'
    )

    return (
      <Content>
        <Panel framed actions={option.none}>
          <TextArea
            name="default"
            label={props.label}
            value={content}
            onChange={setContent}
            error={pipe(
              props.error,
              NonEmptyString.decode,
              either.fold(
                () => option.none,
                () => option.some(props.error)
              )
            )}
            warning={pipe(
              props.warning,
              NonEmptyString.decode,
              either.fold(
                () => option.none,
                () => option.some(props.warning)
              )
            )}
            disabled={props.disabled}
          />
        </Panel>
      </Content>
    )
  },
  args: {
    label: unsafeLocalizedString('Label'),
    error: unsafeLocalizedString(''),
    warning: unsafeLocalizedString(''),
    disabled: false
  }
}
