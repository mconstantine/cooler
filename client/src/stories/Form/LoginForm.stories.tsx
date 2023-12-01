import { Meta, StoryObj } from '@storybook/react'
import { boolean, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { LoginForm, FormData } from '../../components/Form/Forms/LoginForm'
import { ComponentProps } from 'react'

interface LoginFormStoryArgs extends ComponentProps<typeof LoginForm> {
  shouldFail: boolean
}

const meta: Meta<LoginFormStoryArgs> = {
  title: 'Cooler/Forms/LoginForm',
  component: LoginForm,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    shouldFail: {
      name: 'Should fail',
      control: 'boolean',
      description: 'Set this to true to make the form submission fail'
    },
    onRegistrationLinkClick: { action: 'registration link clicked' }
  }
}

export default meta
type Story = StoryObj<LoginFormStoryArgs>

export const Default: Story = {
  render: props => {
    const onSubmit = (data: FormData) =>
      pipe(
        props.shouldFail,
        boolean.fold(
          () => taskEither.rightIO(() => console.log(data)),
          () => taskEither.left(unsafeLocalizedString("I'm an error!"))
        )
      )

    return (
      <Content>
        <LoginForm
          onRegistrationLinkClick={props.onRegistrationLinkClick}
          onSubmit={onSubmit}
        />
      </Content>
    )
  },
  args: {
    shouldFail: false
  }
}
