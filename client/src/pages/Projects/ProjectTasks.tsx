import { boolean, nonEmptyArray, option, readerTaskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { add, skull } from 'ionicons/icons'
import { useEffect, useState } from 'react'
import { a18n, formatDuration } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { HeadingAction } from '../../components/Heading/Heading'
import { RoutedItem } from '../../components/List/List'
import { taskRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { Query } from '../../effects/api/Query'
import { useDelete, useGet } from '../../effects/api/useApi'
import { useDialog } from '../../effects/useDialog'
import { Project } from '../../entities/Project'
import { TaskWithStats } from '../../entities/Task'
import { LocalizedString, unsafePositiveInteger } from '../../globalDomain'
import { Connection, emptyConnection } from '../../misc/Connection'
import { makeTruncateTasksRequest } from '../Tasks/domain'
import {
  getProjectTasksRequest,
  ProjectTasksConnectionQueryInput
} from './domain'

interface Props {
  project: Project
}

export function ProjectTasks(props: Props) {
  const { setRoute } = useRouter()

  const deleteAllTasksCommand = useDelete(
    makeTruncateTasksRequest(props.project._id)
  )

  const [Dialog, deleteAllTasks] = useDialog<void, LocalizedString, void>(
    pipe(
      deleteAllTasksCommand,
      readerTaskEither.chain(() =>
        readerTaskEither.fromIO(() => setTasks(query.right(emptyConnection())))
      )
    ),
    {
      title: () => a18n`Are you sure you want to delete all tasks?`,
      message: () =>
        a18n`All the tasks, sessions and data will be lost forever!`
    }
  )

  const [input, setInput] = useState<ProjectTasksConnectionQueryInput>({
    project: props.project._id,
    query: option.none,
    last: unsafePositiveInteger(10),
    before: option.none
  })

  const [tasks, setTasks] = useState<
    Query<LocalizedString, Connection<TaskWithStats>>
  >(query.loading)

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

  const renderTaskItem: Reader<TaskWithStats, RoutedItem> = task => {
    const workingHours = formatDuration(
      task.actualWorkingHours * 1000 * 60 * 60
    )

    const workingHoursString = a18n`${workingHours} working hours.`

    const taskDescription = pipe(
      task.description,
      option.map(description => ` ${description}`),
      option.getOrElse(() => '')
    )

    const description = a18n`${workingHoursString}${taskDescription}`

    return {
      type: 'routed',
      key: task._id,
      label: option.some(task.project.name),
      content: task.name,
      description: option.some(description),
      action: _ => setRoute(taskRoute(props.project._id, task._id), _),
      details: true
    }
  }

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
    <>
      <ConnectionList
        title={a18n`Tasks`}
        actions={option.some(
          pipe(
            nonEmptyArray.of<HeadingAction>({
              type: 'sync',
              label: a18n`New Task`,
              action: _ => setRoute(taskRoute(props.project._id, 'new'), _),
              icon: option.some(add)
            }),
            nonEmptyArray.concat(
              nonEmptyArray.of<HeadingAction>({
                type: 'sync',
                label: a18n`Delete all`,
                action: deleteAllTasks(),
                icon: option.some(skull),
                color: 'danger'
              })
            )
          )
        )}
        query={tasks}
        onLoadMore={option.some(onLoadMore)}
        onSearchQueryChange={option.none}
        renderListItem={renderTaskItem}
        emptyListMessage={a18n`No tasks found`}
      />
      <Dialog />
    </>
  )
}
