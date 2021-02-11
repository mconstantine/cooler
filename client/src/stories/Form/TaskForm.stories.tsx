import { Meta, Story } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { TaskForm as TaskFormComponent } from '../../components/Form/Forms/TaskForm'
import {
  isSingleTaskCreationInput,
  TaskCreationInput,
  TasksBatchCreationInput
} from '../../entities/Task'
import { CoolerStory } from '../CoolerStory'
import { findProjects } from '../utils'

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
          onCancel={constVoid}
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
