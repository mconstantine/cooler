import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { TextArea } from '../../../components/Form/Input/TextArea/TextArea'
import { Panel } from '../../../components/Panel/Panel'
import { CoolerStory } from '../../CoolerStory'

export const _TextArea: Story = () => {
  const [contentDefault, setContentDefault] = useState(
    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Dolor amet ipsam minus quisquam tempore nisi iste deserunt eveniet culpa expedita quibusdam veniam quis repellat, deleniti alias facilis cum at provident laborum dicta accusamus doloribus.\nLabore, adipisci. Explicabo beatae impedit dolore fugit nulla architecto ducimus, eum deleniti cum suscipit numquam quos.'
  )
  const [contentWarning, setContentWarning] = useState('')
  const [contentError, setContentError] = useState('')
  const [contentDisabled, setContentDisabled] = useState(
    'Lorem ipsum dolor sit amet consectetur adipisicing elit.'
  )

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <TextArea
            name="default"
            label={unsafeLocalizedString('Default')}
            value={contentDefault}
            onChange={setContentDefault}
            warning={option.none}
            error={option.none}
          />
          <TextArea
            name="warning"
            label={unsafeLocalizedString('With warning')}
            value={contentWarning}
            onChange={setContentWarning}
            warning={option.some(unsafeLocalizedString('This is a warning'))}
            error={option.none}
          />
          <TextArea
            name="error"
            label={unsafeLocalizedString('With error')}
            value={contentError}
            onChange={setContentError}
            warning={option.none}
            error={option.some(unsafeLocalizedString('This is an error'))}
          />
          <TextArea
            name="disabled"
            label={unsafeLocalizedString('Disabled')}
            value={contentDisabled}
            onChange={setContentDisabled}
            warning={option.none}
            error={option.none}
            disabled
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Textarea'
}

export default meta
