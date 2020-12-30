import { Meta, Story } from '@storybook/react'
import { taskEither } from 'fp-ts'
import { Content } from '../../components/Content/Content'
import { ClientForm as ClientFormComponent } from '../../components/Form/Forms/ClientForm'
import { ClientCreationInput } from '../../entities/Client'
import { CoolerStory } from '../CoolerStory'

export const ClientForm: Story = ({ onSubmit: logSubmission }) => {
  const onSubmit = (data: ClientCreationInput) =>
    taskEither.rightIO(() => logSubmission(data))

  return (
    <CoolerStory>
      <Content>
        <ClientFormComponent onSubmit={onSubmit} />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/ClientForm',
  argTypes: {
    onSubmit: { action: 'submit' }
  }
}

export default meta
