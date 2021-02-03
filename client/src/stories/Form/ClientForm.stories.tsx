import { Meta, Story } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { ClientForm as ClientFormComponent } from '../../components/Form/Forms/ClientForm'
import { ClientCreationInput } from '../../entities/Client'
import { CoolerStory } from '../CoolerStory'

interface Args {
  shouldFail: boolean
  onSubmit: (data: ClientCreationInput) => void
}

const ClientFormTemplate: Story<Args> = props => {
  const onSubmit = (data: ClientCreationInput) =>
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
        <ClientFormComponent client={option.none} onSubmit={onSubmit} />
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
  onSubmit: { action: 'submit' }
}

const meta: Meta = {
  title: 'Cooler/Form/Client Form'
}

export default meta
