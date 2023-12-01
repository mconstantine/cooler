import { Meta, StoryObj } from '@storybook/react'
import ObjectID from 'bson-objectid'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { SessionForm } from '../../components/Form/Forms/SessionForms'
import { SessionCreationInput } from '../../entities/Session'
import { unsafeObjectId } from '../../globalDomain'
import { ComponentProps } from 'react'

interface SessionFormArgs extends ComponentProps<typeof SessionForm> {
  shouldFail: boolean
}

const meta: Meta<SessionFormArgs> = {
  title: 'Cooler/Forms/SessionForm',
  component: SessionForm,
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
type Story = StoryObj<SessionFormArgs>

export const Default: Story = {
  render: props => {
    const onSubmit = (data: SessionCreationInput) =>
      pipe(
        props.shouldFail,
        boolean.fold(
          () => taskEither.rightIO(() => props.onSubmit(data)),
          () => taskEither.left(unsafeLocalizedString("I'm an error!"))
        )
      )

    return (
      <Content>
        <SessionForm
          session={option.none}
          taskId={unsafeObjectId(ObjectID())}
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
