import { Meta, StoryObj } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { ProjectForm } from '../../components/Form/Forms/ProjectForm'
import { ProjectCreationInput } from '../../entities/Project'
import { findClients } from '../utils'
import { ComponentProps } from 'react'

interface ProjectFormArgs extends ComponentProps<typeof ProjectForm> {
  shouldFail: boolean
}

const meta: Meta<ProjectFormArgs> = {
  title: 'Cooler/Forms/ProjectForm',
  component: ProjectForm,
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
type Story = StoryObj<ProjectFormArgs>

export const Default: Story = {
  render: props => {
    const onSubmit = (data: ProjectCreationInput) =>
      pipe(
        props.shouldFail,
        boolean.fold(
          () => taskEither.rightIO(() => props.onSubmit(data)),
          () => taskEither.left(unsafeLocalizedString("I'm an error!"))
        )
      )

    return (
      <Content>
        <ProjectForm
          project={option.none}
          findClients={findClients}
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
