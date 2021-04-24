import { array, option, taskEither } from 'fp-ts'
import { IO } from 'fp-ts/IO'
import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useLazyQuery } from '../../../effects/useQuery'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { ProjectForm } from '../../Form/Forms/ProjectForm'
import { projectsRoute, useRouter } from '../../Router'
import { clientsQuery } from '../Client/domain'
import { useConfig } from '../../../contexts/ConfigContext'
import { NonEmptyString } from 'io-ts-types'
import { getConnectionNodes } from '../../../misc/graphql'
import { getClientName } from '../../../entities/Client'
import { ProjectCreationInput } from '../../../entities/Project'
import { useMutation } from '../../../effects/useMutation'
import { createProjectMutation } from './domain'

export default function NewProject() {
  const { setRoute } = useRouter()
  const findClientsQuery = useLazyQuery(clientsQuery)
  const { entitiesPerSearch } = useConfig()
  const createProject = useMutation(createProjectMutation)

  const onCancel: IO<void> = () => setRoute(projectsRoute('all'))

  const findClients: ReaderTaskEither<
    string,
    LocalizedString,
    Record<PositiveInteger, LocalizedString>
  > = query =>
    pipe(
      findClientsQuery({
        name: pipe(query, NonEmptyString.decode, option.fromEither),
        first: entitiesPerSearch
      }),
      taskEither.bimap(
        error => error.message,
        ({ clients }) =>
          pipe(
            clients,
            getConnectionNodes,
            array.reduce({}, (res, client) => ({
              ...res,
              [client.id]: getClientName(client)
            }))
          )
      )
    )

  const onCreateProject: ReaderTaskEither<
    ProjectCreationInput,
    LocalizedString,
    void
  > = project =>
    pipe(
      createProject({ project }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(() =>
        taskEither.fromIO(() => setRoute(projectsRoute('all')))
      )
    )

  return (
    <ProjectForm
      project={option.none}
      onCancel={onCancel}
      findClients={findClients}
      onSubmit={onCreateProject}
    />
  )
}
