import { Meta, StoryObj } from '@storybook/react'
import { boolean, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { TaskForm } from '../../components/Form/Forms/TaskForm'
import { TaskCreationInput, TasksBatchCreationInput } from '../../entities/Task'
import { fakeProject } from '../utils'

interface TaskFormArgs {
  shouldFail: boolean
}

const meta: Meta<TaskFormArgs> = {
  title: 'Cooler/Forms/TaskForm',
  component: TaskForm as any,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    shouldFail: {
      name: 'Should fail',
      control: 'boolean',
      description: 'Set this to true to make the form submission fail'
    }
  }
}

export default meta
type Story = StoryObj<TaskFormArgs>

export const Default: Story = {
  render: props => {
    const onSubmit = (data: TaskCreationInput | TasksBatchCreationInput) =>
      pipe(
        props.shouldFail,
        boolean.fold(
          () => taskEither.rightIO(() => console.log(data)),
          () => taskEither.left(unsafeLocalizedString("I'm an error!"))
        )
      )

    return (
      <Content>
        <TaskForm
          mode="add"
          project={fakeProject}
          onSubmit={onSubmit}
          onCancel={constVoid}
        />
      </Content>
    )
  },
  args: {
    shouldFail: false
  }
}
