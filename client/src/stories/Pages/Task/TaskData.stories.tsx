import { Meta, Story } from '@storybook/react'
import { boolean, task as T, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { TaskData as TaskDataComponent } from '../../../components/Pages/Task/TaskData'
import { TaskCreationInput } from '../../../entities/Task'
import { LocalizedString, PositiveInteger } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'
import { fakeProjects, fakeTask } from '../../utils'

interface Args {
  shouldFail: boolean
  onDelete: IO<void>
  showProject: Reader<PositiveInteger, void>
}

const TaskDataTemplate: Story<Args> = props => {
  const [task, setTask] = useState(fakeTask)

  const onChange: ReaderTaskEither<
    TaskCreationInput,
    LocalizedString,
    void
  > = data =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          pipe(
            T.fromIO(() =>
              setTask(task => ({
                ...task,
                ...data,
                project: fakeProjects.find(
                  project => project.id === data.project
                )!
              }))
            ),
            T.delay(500),
            taskEither.rightTask
          ),
        () => taskEither.left(unsafeLocalizedString("I'm an error"))
      )
    )

  const onDelete: ReaderTaskEither<void, LocalizedString, void> = () =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          pipe(T.fromIO(props.onDelete), T.delay(500), taskEither.rightTask),
        () => taskEither.left(unsafeLocalizedString("I'm an error"))
      )
    )

  return (
    <CoolerStory>
      <Content>
        <TaskDataComponent
          task={task}
          onChange={onChange}
          onDelete={onDelete}
          showProject={props.showProject}
        />
      </Content>
    </CoolerStory>
  )
}

export const TaskData = TaskDataTemplate.bind({})

TaskData.args = {
  shouldFail: false
}

TaskData.argTypes = {
  shouldFail: {
    name: 'Should fail',
    description: 'Set this to true to make submission fail',
    control: 'boolean'
  },
  onDelete: {
    action: 'onDelete'
  },
  showProject: {
    action: 'showProject'
  }
}

const meta: Meta = {
  title: 'Cooler/Pages/Task/Task Data'
}

export default meta
