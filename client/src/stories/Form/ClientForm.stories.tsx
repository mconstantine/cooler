import { Meta, Story } from '@storybook/react'
import { boolean, option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { ClientForm as ClientFormComponent } from '../../components/Form/Forms/ClientForm'
import { ClientCreationInput } from '../../entities/Client'
import { CoolerStory } from '../CoolerStory'

interface Args {
  shouldFail: boolean
  onSubmit: Reader<ClientCreationInput, void>
  onDelete: IO<void>
  onCancel: IO<void>
}

const ClientFormTemplate: Story<Args> = props => {
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

  const onDelete = () =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          pipe(
            props.onCancel,
            task.fromIO,
            task.delay(500),
            taskEither.rightTask
          ),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  return (
    <CoolerStory>
      <Content>
        <ClientFormComponent
          client={option.none}
          onSubmit={onSubmit}
          onDelete={onDelete}
          onCancel={props.onCancel}
        />
      </Content>
    </CoolerStory>
  )
}

export const ClientForm = ClientFormTemplate.bind({})

ClientForm.args = {
  shouldFail: false
}

ClientForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    control: 'boolean',
    description: 'Set this to true to make the form submission fail'
  },
  onSubmit: { action: 'submit' },
  onDelete: { action: 'delete' },
  onCancel: { action: 'cancel' }
}

const meta: Meta = {
  title: 'Cooler/Form/Client Form'
}

export default meta
