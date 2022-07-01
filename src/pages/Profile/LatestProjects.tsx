import { array, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useMemo } from 'react'
import { a18n } from '../../a18n'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { List, RoutedItem } from '../../components/List/List'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { projectsRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { useGet } from '../../effects/api/useApi'
import { Project } from '../../entities/Project'
import { unsafePositiveInteger } from '../../globalDomain'
import { ConnectionQueryInput, getConnectionNodes } from '../../misc/Connection'
import { getLatestProjectsRequest } from './domain'

export function LatestProjects() {
  const { setRoute } = useRouter()

  const input: ConnectionQueryInput = useMemo(
    () => ({
      name: option.none,
      first: unsafePositiveInteger(10),
      after: option.none
    }),
    []
  )

  const [latestProjects] = useGet(getLatestProjectsRequest, input)

  return pipe(
    latestProjects,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      projects => (
        <Panel title={a18n`Latest projects`} framed action={option.none}>
          <List
            heading={option.none}
            items={pipe(
              projects,
              getConnectionNodes,
              array.map<Project, RoutedItem>(project => ({
                key: project.id,
                type: 'routed',
                label: option.some(project.client.name),
                content: project.name,
                description: project.description,
                action: () => setRoute(projectsRoute(project.id)),
                details: true
              }))
            )}
          />
        </Panel>
      )
    )
  )
}
