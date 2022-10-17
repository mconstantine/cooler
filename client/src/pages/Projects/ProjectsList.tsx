import { boolean, nonEmptyArray, option } from 'fp-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Option } from 'fp-ts/Option'
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
import { useStorage } from '../../effects/useStorage'
import { Project } from '../../entities/Project'
import { LocalizedString, unsafePositiveInteger } from '../../globalDomain'
import { Connection } from '../../misc/Connection'
import {
  getProjectsRequest,
  GetProjectsRequestInput,
  ProjectQueryFilters
} from './domain'
import './ProjectsList.scss'

export default function ProjectsList() {
  const { setRoute } = useRouter()
  const { readStorage, writeStorage } = useStorage()

  const [input, setInput] = useState<GetProjectsRequestInput>({
    query: option.none,
    first: unsafePositiveInteger(20),
    after: option.none,
    cashed: option.none,
    withInvoiceData: option.none,
    started: option.none,
    ended: option.none
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
    action: _ => setRoute(projectsRoute(project._id), _),
    details: true
  })

  const onSearchQueryChange: Reader<string, void> = flow(
    NonEmptyString.decode,
    option.fromEither,
    query =>
      setInput(input => ({
        ...input,
        query,
        after: option.none
      }))
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

  const setAndSaveFilters = (filters: Partial<ProjectQueryFilters>): void => {
    setInput(input => ({ ...input, ...filters }))

    const currentFilters: ProjectQueryFilters = {
      withInvoiceData: input.withInvoiceData,
      cashed: input.cashed,
      started: input.started,
      ended: input.ended
    }

    writeStorage('projectQueryFilters', {
      ...currentFilters,
      ...filters
    })
  }

  const onWithInvoiceDataChange: Reader<
    Option<boolean>,
    void
  > = withInvoiceData => setAndSaveFilters({ withInvoiceData })

  const onCashedChange: Reader<Option<boolean>, void> = cashed =>
    setAndSaveFilters({ cashed })

  const onStartedChange: Reader<Option<boolean>, void> = started =>
    setAndSaveFilters({ started })

  const onEndedChange: Reader<Option<boolean>, void> = ended =>
    setAndSaveFilters({ ended })

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

  useEffect(() => {
    pipe(
      readStorage('projectQueryFilters'),
      option.fold(constVoid, filters =>
        setInput(input => ({
          ...input,
          ...filters
        }))
      )
    )
  }, [readStorage])

  return (
    <div className="ProjectsList">
      <ConnectionList
        query={results}
        title={a18n`Projects`}
        onLoadMore={option.some(onLoadMore)}
        actions={option.some(
          nonEmptyArray.of({
            type: 'sync',
            label: a18n`New project`,
            icon: option.some(add),
            action: _ => setRoute(projectsRoute('new'), _)
          })
        )}
        onSearchQueryChange={option.some(onSearchQueryChange)}
        renderListItem={renderProjectItem}
        emptyListMessage={a18n`No projects found`}
      >
        <Toggle
          name="withInvoiceData"
          mode="3-state"
          label={a18n`With invoice data`}
          value={input.withInvoiceData}
          onChange={onWithInvoiceDataChange}
          error={option.none}
          warning={option.none}
        />
        <Toggle
          name="cashed"
          mode="3-state"
          label={a18n`Cashed`}
          value={input.cashed}
          onChange={onCashedChange}
          error={option.none}
          warning={option.none}
        />
        <Toggle
          name="started"
          mode="3-state"
          label={a18n`Started`}
          value={input.started}
          onChange={onStartedChange}
          error={option.none}
          warning={option.none}
        />
        <Toggle
          name="ended"
          mode="3-state"
          label={a18n`Ended`}
          value={input.ended}
          onChange={onEndedChange}
          error={option.none}
          warning={option.none}
        />
      </ConnectionList>
    </div>
  )
}
