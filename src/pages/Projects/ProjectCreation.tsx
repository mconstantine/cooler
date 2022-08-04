import { option, taskEither } from 'fp-ts'
import { flow } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { ProjectForm } from '../../components/Form/Forms/ProjectForm'
import { projectsRoute, useRouter } from '../../components/Router'
import { usePost } from '../../effects/api/useApi'
import { ProjectCreationInput } from '../../entities/Project'
import { LocalizedString } from '../../globalDomain'
import { createProjectRequest } from './domain'
import { useFindClients } from './useFindClients'

export default function ProjectCreation() {
  const { setRoute } = useRouter()
  const findClients = useFindClients()
  const createProject = usePost(createProjectRequest)

  const onSubmit: ReaderTaskEither<
    ProjectCreationInput,
    LocalizedString,
    void
  > = flow(
    createProject,
    taskEither.chain(project =>
      taskEither.fromIO(() => setRoute(projectsRoute(project._id)))
    )
  )

  const onCancel: IO<void> = () => setRoute(projectsRoute('all'))

  return (
    <ProjectForm
      project={option.none}
      findClients={findClients}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  )
}
