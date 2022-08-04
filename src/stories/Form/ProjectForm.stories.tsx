import { Meta, Story } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { ProjectForm as ProjectFormComponent } from '../../components/Form/Forms/ProjectForm'
import { ProjectCreationInput } from '../../entities/Project'
import { CoolerStory } from '../CoolerStory'
import { findClients } from '../utils'

interface Args {
  shouldFail: boolean
  onSubmit: (data: ProjectCreationInput) => void
  onCancel: IO<void>
}

const ProjectFormTemplate: Story<Args> = props => {
  const onSubmit = (data: ProjectCreationInput) =>
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
        <ProjectFormComponent
          project={option.none}
          findClients={findClients}
          onSubmit={onSubmit}
          onCancel={props.onCancel}
        />
      </Content>
    </CoolerStory>
  )
}

export const ProjectForm = ProjectFormTemplate.bind({})

ProjectForm.args = {
  shouldFail: false
}

ProjectForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    control: 'boolean',
    description: 'Set this to true to make the form submission fail'
  },
  onSubmit: { action: 'submit' },
  onCancel: { action: 'cancel' }
}

const meta: Meta = {
  title: 'Cooler/Form/Project Form'
}

export default meta
