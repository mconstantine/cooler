import { Meta, Story } from '@storybook/react'
import { boolean, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import {
  FormData,
  RegistrationForm as RegistrationFormComponent
} from '../../components/Form/Forms/RegistrationForm'
import { CoolerStory } from '../CoolerStory'

interface Args {
  onSubmit: Reader<FormData, void>
  onLoginLinkClick: IO<void>
  shouldFail: boolean
}

const RegistrationFormTemplate: Story<Args> = props => {
  const onSubmit = (data: FormData) =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () => taskEither.rightIO(() => props.onSubmit(data)),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  return (
    <CoolerStory>
      <Content>
        <RegistrationFormComponent
          onLoginLinkClick={props.onLoginLinkClick}
          onSubmit={onSubmit}
        />
      </Content>
    </CoolerStory>
  )
}

export const RegistrationForm = RegistrationFormTemplate.bind({})

RegistrationForm.args = {
  shouldFail: false
}

RegistrationForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    control: 'boolean',
    description: 'Set this to true to make the form submission fail'
  },
  onSubmit: { action: 'registered' },
  onLoginLinkClick: { action: 'login link clicked' }
}

const meta: Meta = {
  title: 'Cooler/Form/Registration Form'
}

export default meta
