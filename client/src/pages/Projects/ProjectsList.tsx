import { boolean, option } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { add } from 'ionicons/icons'
import { useEffect, useState } from 'react'
import { a18n } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { Toggle } from '../../components/Form/Input/Toggle/Toggle'
import { RoutedItem } from '../../components/List/List'
import { projectsRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { Query } from '../../effects/api/Query'
import { useGet } from '../../effects/api/useApi'
import { Project } from '../../entities/Project'
import { LocalizedString, unsafePositiveInteger } from '../../globalDomain'
import { Connection } from '../../misc/Connection'
import { getProjectsRequest, GetProjectsRequestInput } from './domain'

export default function ProjectsList() {
  const { setRoute } = useRouter()

  const [input, setInput] = useState<GetProjectsRequestInput>({
    query: option.none,
    first: unsafePositiveInteger(20),
    after: option.none,
    notCashedOnly: false
  })

  const [projects] = useGet(getProjectsRequest, input)
  const [results, setResults] =
    useState<Query<LocalizedString, Connection<Project>>>(projects)

  const renderProjectItem: Reader<Project, RoutedItem> = project => ({
    type: 'routed',
    key: project._id,
    label: option.some(project.client.name),
    content: project.name,
    description: project.description,
    action: () => setRoute(projectsRoute(project._id)),
    details: true
  })

  const onSearchQueryChange: Reader<string, void> = flow(
    NonEmptyString.decode,
    option.fromEither,
    query => setInput({ ...input, query })
  )

  const onLoadMore: IO<void> = () => {
    pipe(
      projects,
      query.map(projects =>
        query.fromIO(() =>
          pipe(
            projects.pageInfo.hasNextPage,
            boolean.fold(constVoid, () =>
              pipe(
                projects.pageInfo.endCursor,
                option.fold(constVoid, endCursor =>
                  setInput(input => ({
                    ...input,
                    after: option.some(endCursor)
                  }))
                )
              )
            )
          )
        )
      )
    )
  }

  const onNotCashedOnlyChange: Reader<boolean, void> = notCashedOnly =>
    setInput(input => ({ ...input, notCashedOnly }))

  useEffect(() => {
    pipe(
      projects,
      query.chain(cursor =>
        query.fromIO(() =>
          setResults(results =>
            cursor.pageInfo.hasPreviousPage
              ? pipe(
                  results,
                  query.map(results => ({
                    pageInfo: cursor.pageInfo,
                    edges: [...results.edges, ...cursor.edges]
                  }))
                )
              : projects
          )
        )
      )
    )
  }, [projects])

  return (
    <ConnectionList
      query={results}
      title={a18n`Projects`}
      onLoadMore={option.some(onLoadMore)}
      action={option.some({
        type: 'sync',
        label: a18n`Create new project`,
        icon: option.some(add),
        action: () => setRoute(projectsRoute('new'))
      })}
      onSearchQueryChange={option.some(onSearchQueryChange)}
      renderListItem={renderProjectItem}
      emptyListMessage={a18n`No projects found`}
    >
      <Toggle
        name="notCashedOnly"
        label={a18n`Show only not cashed`}
        value={input.notCashedOnly}
        onChange={onNotCashedOnlyChange}
        error={option.none}
        warning={option.none}
      />
    </ConnectionList>
  )
}
