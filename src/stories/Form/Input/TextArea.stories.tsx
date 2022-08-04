import { Meta, Story } from '@storybook/react'
import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { TextArea as TextAreaComponent } from '../../../components/Form/Input/TextArea/TextArea'
import { Panel } from '../../../components/Panel/Panel'
import { LocalizedString } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'

interface Args {
  label: LocalizedString
  error: LocalizedString
  warning: LocalizedString
  disabled: boolean
}

const TextAreaTemplate: Story<Args> = props => {
  const [content, setContent] = useState(
    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor amet ipsam minus quisquam tempore nisi iste deserunt eveniet culpa expedita quibusdam veniam quis repellat, deleniti alias facilis cum at provident laborum dicta accusamus doloribus.\nLabore, adipisci. Explicabo beatae impedit dolore fugit nulla architecto ducimus, eum deleniti cum suscipit numquam quos.'
  )

  return (
    <CoolerStory>
      <Content>
        <Panel framed action={option.none}>
          <TextAreaComponent
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
    </CoolerStory>
  )
}

export const TextArea = TextAreaTemplate.bind({})

TextArea.args = {
  label: unsafeLocalizedString('Label'),
  error: unsafeLocalizedString(''),
  warning: unsafeLocalizedString(''),
  disabled: false
}

TextArea.argTypes = {
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

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Text Area'
}

export default meta
