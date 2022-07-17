import { nonEmptyArray, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useMemo } from 'react'
import { a18n } from '../../a18n'
import { Body } from '../../components/Body/Body'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { List } from '../../components/List/List'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { tasksRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { useGet } from '../../effects/api/useApi'
import { getTasksDueTodayRequest } from './domain'

export function TasksDueToday() {
  const { setRoute } = useRouter()

  const input = useMemo(() => {
    const now = new Date()

    return {
      since: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    }
  }, [])

  const [tasksDueToday] = useGet(getTasksDueTodayRequest, input)

  return pipe(
    tasksDueToday,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      tasks => (
        <Panel title={a18n`Tasks due today`} action={option.none} framed>
          {pipe(
            tasks,
            nonEmptyArray.fromArray,
            option.fold(
              () => <Body>{a18n`No tasks due today.`}</Body>,
              tasks => (
                <List
                  heading={option.none}
                  items={tasks.map(task => ({
                    type: 'routed',
                    key: task._id,
                    label: option.some(task.project.name),
                    content: task.name,
                    description: task.description,
                    action: () => setRoute(tasksRoute(task._id)),
                    details: true
                  }))}
                  emptyListMessage={a18n`No tasks due today`}
                />
              )
            )
          )}
        </Panel>
      )
    )
  )
}
