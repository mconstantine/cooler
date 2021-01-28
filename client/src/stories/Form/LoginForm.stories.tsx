import { Meta, Story } from '@storybook/react'
import { boolean, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import {
  LoginForm as LoginFormComponent,
  FormData,
  RegistrationData,
  LoginData,
  foldFormData
} from '../../components/Form/Forms/LoginForm'
import { CoolerStory } from '../CoolerStory'

interface Args {
  onRegister: (data: RegistrationData) => void
  onLogin: (data: LoginData) => void
  shouldFail: boolean
}

const LoginFormTemplate: Story<Args> = props => {
  const onSubmit = (data: FormData) =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          taskEither.rightIO(() =>
            pipe(data, foldFormData(props.onRegister, props.onLogin))
          ),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  return (
    <CoolerStory>
      <Content>
        <LoginFormComponent onSubmit={onSubmit} />
      </Content>
    </CoolerStory>
  )
}

export const LoginForm = LoginFormTemplate.bind({})

LoginForm.args = {
  shouldFail: false
}

LoginForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    control: 'boolean',
    description: 'Set this to true to make the form submission fail'
  },
  onRegister: { action: 'registered' },
  onLogin: { action: 'logged in' }
}

const meta: Meta = {
  title: 'Cooler/Form/Login Form'
}

export default meta
