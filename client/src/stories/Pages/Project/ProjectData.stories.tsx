import { Meta, Story } from '@storybook/react'
import { task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useState } from 'react'
import { Content } from '../../../components/Content/Content'
import { ProjectData as ProjectDataComponent } from '../../../components/Pages/Project/ProjectData'
import { Project, ProjectCreationInput } from '../../../entities/Project'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'
import { fakeProject, fakeClients, findClients } from '../../utils'

interface Args {
  onDelete: Reader<Project, unknown>
  showClient: Reader<PositiveInteger, unknown>
}

const ProjectDataTemplate: Story<Args> = props => {
  const [project, setProject] = useState(fakeProject)

  const onProjectChange = (data: ProjectCreationInput) =>
    taskEither.rightIO(() =>
      setProject(project => ({
        ...project,
        ...data,
        client: fakeClients.find(client => client.id === data.client)!
      }))
    )

  const onDelete: ReaderTaskEither<void, LocalizedString, unknown> = () =>
    pipe(
      task.fromIO(() => props.onDelete(project)),
      task.delay(500),
      taskEither.rightTask
    )

  return (
    <CoolerStory>
      <Content>
        <ProjectDataComponent
          project={project}
          findClients={findClients}
          onChange={onProjectChange}
          onDelete={onDelete}
          showClient={props.showClient}
        />
      </Content>
    </CoolerStory>
  )
}

export const ProjectData = ProjectDataTemplate.bind({})

ProjectData.args = {}

ProjectData.argTypes = {
  onDelete: {
    action: 'onDelete'
  },
  showClient: {
    action: 'showClient'
  }
}

const meta: Meta = {
  title: 'Cooler/Pages/Project/Project Data'
}

export default meta
