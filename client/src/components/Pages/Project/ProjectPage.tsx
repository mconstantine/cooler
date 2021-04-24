import { array, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { Option } from 'fp-ts/Option'
import { Reader } from 'fp-ts/Reader'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { NonEmptyString } from 'io-ts-types'
import { useMemo } from 'react'
import { useConfig } from '../../../contexts/ConfigContext'
import { useMutation } from '../../../effects/useMutation'
import { foldQuery, useLazyQuery, useQuery } from '../../../effects/useQuery'
import { getClientName } from '../../../entities/Client'
import {
  CashData,
  Project,
  ProjectCreationInput
} from '../../../entities/Project'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { getConnectionNodes } from '../../../misc/graphql'
import { ErrorPanel } from '../../ErrorPanel/ErrorPanel'
import { LoadingBlock } from '../../Loading/LoadingBlock'
import { clientsRoute, projectsRoute, useRouter } from '../../Router'
import { clientsQuery } from '../Client/domain'
import {
  deleteProjectMutation,
  projectQuery,
  updateProjectMutation
} from './domain'
import { ProjectCashData } from './ProjectCashData'
import { ProjectData } from './ProjectData'
import { ProjectProgress } from './ProjectProgress'

interface Props {
  id: PositiveInteger
}

export default function ProjectPage(props: Props) {
  const { entitiesPerSearch } = useConfig()
  const { setRoute } = useRouter()
  const input = useMemo(() => ({ id: props.id }), [props.id])
  const { query, update } = useQuery(projectQuery, input)
  const findClientsQuery = useLazyQuery(clientsQuery)
  const updateProject = useMutation(updateProjectMutation)
  const deleteProject = useMutation(deleteProjectMutation)

  const onChange: ReaderTaskEither<
    ProjectCreationInput,
    LocalizedString,
    void
  > = project =>
    pipe(
      updateProject({ id: props.id, project }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(({ updateProject }) =>
        taskEither.fromIO(() =>
          update(({ project }) => ({
            project: {
              ...project,
              ...updateProject
            }
          }))
        )
      )
    )

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

  const showClient: Reader<PositiveInteger, void> = id =>
    setRoute(clientsRoute(id))

  const onCashDataChange = (
    project: Project,
    data: Option<CashData>
  ): TaskEither<LocalizedString, void> => {
    return pipe(
      updateProject({
        id: project.id,
        project: {
          name: project.name,
          description: project.description,
          client: project.client.id,
          cashed: data
        }
      }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(({ updateProject }) =>
        taskEither.fromIO(() =>
          update(({ project }) => ({
            project: { ...project, ...updateProject }
          }))
        )
      )
    )
  }

  const onDelete: ReaderTaskEither<
    PositiveInteger,
    LocalizedString,
    void
  > = id =>
    pipe(
      deleteProject({ id }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(() =>
        taskEither.fromIO(() => setRoute(projectsRoute('all')))
      )
    )

  return pipe(
    query,
    foldQuery(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error.message} />,
      ({ project }) => (
        <>
          <ProjectData
            project={project}
            onChange={onChange}
            onDelete={() => onDelete(project.id)}
            findClients={findClients}
            showClient={showClient}
            onBack={option.some(() => setRoute(projectsRoute('all')))}
          />
          <ProjectCashData
            data={project.cashed}
            budget={project.budget}
            balance={project.balance}
            taxes={getConnectionNodes(project.client.user.taxes)}
            onChange={data => onCashDataChange(project, data)}
          />
          <ProjectProgress
            data={project}
            isProjectCashed={option.isSome(project.cashed)}
            taxes={getConnectionNodes(project.client.user.taxes)}
          />
        </>
      )
    )
  )
}
