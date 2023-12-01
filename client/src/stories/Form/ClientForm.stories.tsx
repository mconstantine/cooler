import { Meta, StoryObj } from '@storybook/react'
import { boolean, option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { ClientForm } from '../../components/Form/Forms/ClientForm'
import { ClientCreationInput } from '../../entities/Client'
import { ComponentProps } from 'react'

interface ClientFormStoryArgs extends ComponentProps<typeof ClientForm> {
  shouldFail: boolean
}

const meta: Meta<ClientFormStoryArgs> = {
  title: 'Cooler/Forms/ClientForm',
  component: ClientForm,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    shouldFail: {
      name: 'Should fail',
      control: 'boolean',
      description: 'Set this to true to make the form submission fail'
    },
    onSubmit: { action: 'submit' },
    onCancel: { action: 'cancel' }
  }
}

export default meta
type Story = StoryObj<ClientFormStoryArgs>

export const Default: Story = {
  render: props => {
    const onSubmit = (data: ClientCreationInput) =>
      pipe(
        props.shouldFail,
        boolean.fold(
          () =>
            pipe(
              () => props.onSubmit(data),
              task.fromIO,
              task.delay(500),
              taskEither.rightTask
            ),
          () => taskEither.left(unsafeLocalizedString("I'm an error!"))
        )
      )

    return (
      <Content>
        <ClientForm
          client={option.none}
          onSubmit={onSubmit}
          onCancel={props.onCancel}
        />
      </Content>
    )
  },
  args: {
    shouldFail: false
  }
}
