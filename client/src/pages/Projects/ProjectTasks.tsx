import { boolean, nonEmptyArray, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { add } from 'ionicons/icons'
import { useEffect, useState } from 'react'
import { a18n } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { taskRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { Query } from '../../effects/api/Query'
import { useGet } from '../../effects/api/useApi'
import { Project } from '../../entities/Project'
import { Task } from '../../entities/Task'
import { LocalizedString, unsafePositiveInteger } from '../../globalDomain'
import { Connection } from '../../misc/Connection'
import {
  getProjectTasksRequest,
  ProjectTasksConnectionQueryInput
} from './domain'

interface Props {
  project: Project
}

export function ProjectTasks(props: Props) {
  const { setRoute } = useRouter()

  const [input, setInput] = useState<ProjectTasksConnectionQueryInput>({
    project: props.project._id,
    query: option.none,
    last: unsafePositiveInteger(10),
    before: option.none
  })

  const [tasks, setTasks] = useState<Query<LocalizedString, Connection<Task>>>(
    query.loading
  )

  const [searchResults] = useGet(getProjectTasksRequest, input)

  const onLoadMore: IO<void> = () =>
    pipe(
      searchResults,
      query.map(results =>
        query.fromIO(() =>
          pipe(
            results.pageInfo.hasNextPage,
            boolean.fold(constVoid, () =>
              pipe(
                results.pageInfo.endCursor,
                option.fold(constVoid, cursor =>
                  setInput({
                    ...input,
                    before: option.some(cursor)
                  })
                )
              )
            )
          )
        )
      )
    )

  const renderTaskItem: Reader<Task, RoutedItem> = task => ({
    type: 'routed',
    key: task._id,
    label: option.some(task.project.name),
    content: task.name,
    description: task.description,
    action: () => setRoute(taskRoute(props.project._id, task._id)),
    details: true
  })

  useEffect(() => {
    pipe(
      searchResults,
      query.chain(results =>
        query.fromIO(() =>
          setTasks(tasks =>
            results.pageInfo.hasPreviousPage
              ? pipe(
                  tasks,
                  query.map(tasks => ({
                    pageInfo: results.pageInfo,
                    edges: [...tasks.edges, ...results.edges]
                  }))
                )
              : searchResults
          )
        )
      )
    )
  }, [searchResults])

  useEffect(() => {
    setInput({
      project: props.project._id,
      query: option.none,
      last: unsafePositiveInteger(10),
      before: option.none
    })
  }, [props.project._id])

  return (
    <ConnectionList
      title={a18n`Tasks`}
      actions={option.some(
        nonEmptyArray.of({
          type: 'sync',
          label: a18n`New Task`,
          action: () => setRoute(taskRoute(props.project._id, 'new')),
          icon: option.some(add)
        })
      )}
      query={tasks}
      onLoadMore={option.some(onLoadMore)}
      onSearchQueryChange={option.none}
      renderListItem={renderTaskItem}
      emptyListMessage={a18n`No tasks found`}
    />
  )
}
