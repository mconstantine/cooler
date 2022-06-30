import { Meta, Story } from '@storybook/react'
import { boolean, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import {
  LoginForm as LoginFormComponent,
  FormData
} from '../../components/Form/Forms/LoginForm'
import { CoolerStory } from '../CoolerStory'

interface Args {
  onLogin: (data: FormData) => void
  shouldFail: boolean
}

const LoginFormTemplate: Story<Args> = props => {
  const onSubmit = (data: FormData) =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () => taskEither.rightIO(() => props.onLogin(data)),
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
  onLogin: { action: 'logged in' }
}

const meta: Meta = {
  title: 'Cooler/Form/Login Form'
}

export default meta
