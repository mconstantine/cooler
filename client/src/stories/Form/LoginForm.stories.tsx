import { Meta, Story } from '@storybook/react'
import { taskEither } from 'fp-ts'
import { TaskEither } from 'fp-ts/TaskEither'
import { Content } from '../../components/Content/Content'
import {
  LoginForm as LoginFormComponent,
  SubmitData
} from '../../components/Form/Forms/LoginForm'
import { LocalizedString } from '../../globalDomain'
import { CoolerStory } from '../CoolerStory'

export const LoginForm: Story = ({ onRegister, onLogin }) => {
  const onSubmit: (
    data: SubmitData
  ) => TaskEither<LocalizedString, unknown> = ({ type, ...data }) =>
    taskEither.rightIO(() => {
      switch (type) {
        case 'Register':
          return onRegister(data)
        case 'Login':
          return onLogin(data)
      }
    })

  return (
    <CoolerStory>
      <Content>
        <LoginFormComponent onSubmit={onSubmit} />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Login Form',
  argTypes: {
    onRegister: { action: 'registered' },
    onLogin: { action: 'logged in' }
  }
}

export default meta
