import { Meta, Story } from '@storybook/react'
import { boolean, option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { TaskForm as TaskFormComponent } from '../../components/Form/Forms/TaskForm'
import {
  isSingleTaskCreationInput,
  TaskCreationInput,
  TasksBatchCreationInput
} from '../../entities/Task'
import {
  LocalizedString,
  PositiveInteger,
  unsafePositiveInteger
} from '../../globalDomain'
import { CoolerStory } from '../CoolerStory'

interface FakeProject {
  id: PositiveInteger
  name: LocalizedString
}

const fakeProjects: FakeProject[] = [
  {
    id: unsafePositiveInteger(1),
    name: unsafeLocalizedString('Some Project')
  },
  {
    id: unsafePositiveInteger(2),
    name: unsafeLocalizedString('Another Project')
  }
]

const findProjects = (
  input: string
): TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>> => {
  const regex = new RegExp(input, 'i')

  return pipe(
    fakeProjects
      .filter(({ name }) => regex.test(name))
      .reduce<Record<PositiveInteger, LocalizedString>>(
        (res, { id, name }) => ({ ...res, [id]: name }),
        {}
      ),
    options => task.fromIO(() => options),
    task.delay(500),
    taskEither.rightTask
  )
}

interface Args {
  shouldFail: boolean
  onSingleTaskSubmit: (data: TaskCreationInput) => void
  onTasksBatchSubmit: (data: TasksBatchCreationInput) => void
}

const TaskFormTemplate: Story<Args> = props => {
  const onSubmit = (data: TaskCreationInput | TasksBatchCreationInput) =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          taskEither.rightIO(() =>
            isSingleTaskCreationInput(data)
              ? props.onSingleTaskSubmit(data)
              : props.onTasksBatchSubmit(data)
          ),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  return (
    <CoolerStory>
      <Content>
        <TaskFormComponent
          mode="add"
          task={option.none}
          findProjects={option.some(findProjects)}
          onSubmit={onSubmit}
        />
      </Content>
    </CoolerStory>
  )
}

export const TaskForm = TaskFormTemplate.bind({})

TaskForm.args = {
  shouldFail: false
}

TaskForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    control: 'boolean',
    description: 'Set this to true to make the form submission fail'
  },
  onSingleTaskSubmit: { action: 'submit single task' },
  onTasksBatchSubmit: { action: 'submit tasks batch' }
}

const meta: Meta = {
  title: 'Cooler/Form/Task Form'
}

export default meta
