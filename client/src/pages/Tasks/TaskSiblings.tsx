import { nonEmptyArray, option } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Option } from 'fp-ts/Option'
import { a18n, unsafeLocalizedString } from '../../a18n'
import { List, RoutedItem } from '../../components/List/List'
import { Panel } from '../../components/Panel/Panel'
import { taskRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { Query } from '../../effects/api/Query'
import { useGet } from '../../effects/api/useApi'
import { Task } from '../../entities/Task'
import { LocalizedString } from '../../globalDomain'
import { makeGetNextTaskQuery, makeGetPreviousTaskQuery } from './domain'

interface Props {
  task: Task
}

export function TaskSiblings(props: Props) {
  const { setRoute } = useRouter()

  const [previousTask] = useGet(makeGetPreviousTaskQuery(props.task._id))
  const [nextTask] = useGet(makeGetNextTaskQuery(props.task._id))

  const makeTaskItem = (
    label: LocalizedString,
    q: Query<LocalizedString, Task>
  ): Option<NonEmptyArray<RoutedItem>> =>
    pipe(
      q,
      query.fold(
        () => option.none,
        () => option.none,
        task =>
          option.some<RoutedItem>({
            key: task._id,
            type: 'routed',
            label: option.some(label),
            content: task.name,
            description: option.some(task.project.name),
            action: _ => setRoute(taskRoute(task.project._id, task._id), _),
            details: true
          })
      ),
      option.map(nonEmptyArray.of)
    )

  const previousTaskListItem = makeTaskItem(a18n`Previous task`, previousTask)
  const nextTaskListItem = makeTaskItem(a18n`Next task`, nextTask)

  const listItems: Option<NonEmptyArray<RoutedItem>> = pipe(
    previousTaskListItem,
    option.fold(
      () => nextTaskListItem,
      previousTaskListItem =>
        pipe(
          nextTaskListItem,
          option.fold(
            () => option.some(previousTaskListItem),
            nextTaskListItem =>
              pipe(
                previousTaskListItem,
                nonEmptyArray.concat(nextTaskListItem),
                option.some
              )
          )
        )
    )
  )

  return (
    <Panel framed actions={option.none}>
      {pipe(
        listItems,
        option.fold(constNull, listItems => (
          <List
            heading={option.none}
            emptyListMessage={unsafeLocalizedString('')}
            items={listItems}
          />
        ))
      )}
    </Panel>
  )
}
