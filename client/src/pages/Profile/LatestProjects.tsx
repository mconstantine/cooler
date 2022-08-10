import { nonEmptyArray, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useMemo } from 'react'
import { a18n } from '../../a18n'
import { Body } from '../../components/Body/Body'
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
      query: option.none,
      last: unsafePositiveInteger(10),
      before: option.none
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
        <Panel title={a18n`Latest projects`} framed actions={option.none}>
          {pipe(
            getConnectionNodes(projects),
            nonEmptyArray.fromArray,
            option.fold(
              () => <Body>{a18n`No projects found.`}</Body>,
              projects => (
                <List
                  heading={option.none}
                  items={pipe(
                    projects,
                    nonEmptyArray.map<Project, RoutedItem>(project => ({
                      key: project._id,
                      type: 'routed',
                      label: option.some(project.client.name),
                      content: project.name,
                      description: project.description,
                      action: () => setRoute(projectsRoute(project._id)),
                      details: true
                    }))
                  )}
                  emptyListMessage={a18n`No projects found`}
                />
              )
            )
          )}
        </Panel>
      )
    )
  )
}
