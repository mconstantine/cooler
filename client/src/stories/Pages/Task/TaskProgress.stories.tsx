import { Meta, Story } from '@storybook/react'
import { boolean, option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { TaskEither } from 'fp-ts/TaskEither'
import { ComponentProps, useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { TaskProgress as TaskProgressComponent } from '../../../components/Pages/Task/TaskProgress'
import { Session } from '../../../entities/Session'
import {
  LocalizedString,
  NonNegativeNumber,
  unsafePositiveInteger
} from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'
import { fakeTask } from '../../utils'

interface Args {
  mode: ComponentProps<typeof TaskProgressComponent>['mode']
  shouldFail: boolean
  useCurrentSession: boolean
}

const TaskProgressTemplate: Story<Args> = props => {
  const [actualWorkingHours, setActualWorkingHours] = useState(
    fakeTask.actualWorkingHours
  )

  const currentSession: Option<Session> = pipe(
    props.useCurrentSession,
    boolean.fold(
      () => option.none,
      () =>
        option.some({
          id: unsafePositiveInteger(1),
          start_time: new Date(Date.now() - 3600000),
          end_time: option.none,
          task: fakeTask
        })
    )
  )

  const startSession: TaskEither<LocalizedString, Session> = pipe(
    props.shouldFail,
    boolean.fold(
      () =>
        pipe(
          task.fromIO<Session>(() => ({
            id: unsafePositiveInteger(2),
            start_time: new Date(),
            end_time: option.none,
            task: fakeTask
          })),
          task.delay(500),
          taskEither.rightTask
        ),
      () => taskEither.left(unsafeLocalizedString("I'm an error!"))
    )
  )

  const stopSession: ReaderTaskEither<
    Session,
    LocalizedString,
    void
  > = session =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          taskEither.rightIO(() =>
            setActualWorkingHours(
              actualWorkingHours =>
                (actualWorkingHours +
                  (Date.now() - session.start_time.getTime()) /
                    3600000) as NonNegativeNumber
            )
          ),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  return (
    <CoolerStory>
      <Content>
        <TaskProgressComponent
          mode={props.mode}
          data={{ ...fakeTask, actualWorkingHours }}
          currentSession={currentSession}
          startSession={startSession}
          stopSession={stopSession}
        />
      </Content>
    </CoolerStory>
  )
}

export const TaskProgress = TaskProgressTemplate.bind({})

TaskProgress.args = {
  mode: 'inTaskPage',
  shouldFail: false,
  useCurrentSession: false
}

TaskProgress.argTypes = {
  mode: {
    name: 'Mode',
    control: {
      type: 'select',
      options: {
        Standalone: 'standalone',
        'In Task page': 'inTaskPage'
      } as Record<string, Args['mode']>
    }
  },
  shouldFail: {
    name: 'Should fail',
    description: 'Set this to true to make operations fail',
    control: 'boolean'
  },
  useCurrentSession: {
    name: 'Simulate current session',
    description:
      'Simulate that there was a session already started one hour ago',
    control: 'boolean'
  }
}

const meta: Meta = {
  title: 'Cooler/Pages/Task/Task Progress'
}

export default meta
