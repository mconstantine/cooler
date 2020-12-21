import { Meta, Story } from '@storybook/react'
import { useEffect, useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { TextInput as TextInputComponent } from '../../../components/Form/Input/TextInput/TextInput'
import { LocalizedString } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'
import { option } from 'fp-ts'
import { Option } from 'fp-ts/Option'
import { Panel } from '../../../components/Panel/Panel'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'

export const TextInput: Story = () => {
  const [defaultInputValue, setDefaultInputValue] = useState('')
  const [passwordInputValue, setPasswordInputValue] = useState('')
  const [inputWithErrorValue, setInputWithErrorValue] = useState('Empty me!')
  const [disabledInputValue, setDisabledInputValue] = useState(
    'Disabled input value'
  )

  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  useEffect(() => {
    setError(
      pipe(
        NonEmptyString.decode(inputWithErrorValue),
        option.fromEither,
        option.fold(
          () => option.none,
          () => option.some(unsafeLocalizedString('Error message goes here'))
        )
      )
    )
  }, [inputWithErrorValue])

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <TextInputComponent
            label={unsafeLocalizedString('Default text input')}
            name="text-input"
            value={defaultInputValue}
            onChange={setDefaultInputValue}
            error={option.none}
          />
          <TextInputComponent
            type="password"
            label={unsafeLocalizedString('Password input')}
            name="password-input"
            value={passwordInputValue}
            onChange={setPasswordInputValue}
            error={option.none}
          />
          <TextInputComponent
            label={unsafeLocalizedString('I must be empty (weird uh?)')}
            name="text-input-error"
            value={inputWithErrorValue}
            onChange={setInputWithErrorValue}
            error={error}
          />
          <TextInputComponent
            label={unsafeLocalizedString('Disabled input')}
            name="text-input-disabled"
            value={disabledInputValue}
            onChange={setDisabledInputValue}
            error={option.none}
            disabled
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/TextInput'
}

export default meta
