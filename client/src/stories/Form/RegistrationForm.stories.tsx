import { Meta, StoryObj } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import {
  FormData,
  RegistrationForm
} from '../../components/Form/Forms/RegistrationForm'
import { ComponentProps } from 'react'

interface RegistrationFormArgs extends ComponentProps<typeof RegistrationForm> {
  shouldFail: boolean
}

const meta: Meta<RegistrationFormArgs> = {
  title: 'Cooler/Forms/RegistrationForm',
  component: RegistrationForm,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    shouldFail: {
      name: 'Should fail',
      control: 'boolean',
      description: 'Set this to true to make the form submission fail'
    },
    onSubmit: { action: 'registered' },
    onLoginLinkClick: { action: 'login link clicked' }
  }
}

export default meta
type Story = StoryObj<RegistrationFormArgs>

export const Default: Story = {
  render: props => {
    const onSubmit = (data: FormData) =>
      pipe(
        props.shouldFail,
        boolean.fold(
          () => taskEither.rightIO(() => props.onSubmit(data)),
          () => taskEither.left(unsafeLocalizedString("I'm an error!"))
        )
      )

    return (
      <Content>
        <RegistrationForm
          onLoginLinkClick={props.onLoginLinkClick}
          onSubmit={onSubmit}
          onCancel={option.none}
        />
      </Content>
    )
  },
  args: {
    shouldFail: false
  }
}
