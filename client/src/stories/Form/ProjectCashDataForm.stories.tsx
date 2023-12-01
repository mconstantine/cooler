import { Meta, StoryObj } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { ProjectCashDataForm } from '../../components/Form/Forms/ProjectCashDataForm'
import { ProjectCashData } from '../../entities/Project'
import { fakeProject } from '../utils'
import { ComponentProps } from 'react'

interface ProjectCashDataFormArgs
  extends ComponentProps<typeof ProjectCashDataForm> {
  shouldFail: boolean
}

const meta: Meta<ProjectCashDataFormArgs> = {
  title: 'Cooler/Forms/ProjectCashDataForm',
  component: ProjectCashDataForm,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    shouldFail: {
      name: 'Should fail',
      control: 'boolean',
      description: 'Set this to true to make the form submission fail'
    },
    onSubmit: { action: 'submit' },
    onCancel: { action: 'cancel' }
  }
}

export default meta
type Story = StoryObj<ProjectCashDataFormArgs>

export const Default: Story = {
  render: props => {
    const onSubmit = (data: ProjectCashData) =>
      pipe(
        props.shouldFail,
        boolean.fold(
          () => taskEither.rightIO(() => console.log(data)),
          () => taskEither.left(unsafeLocalizedString("I'm an error!"))
        )
      )

    return (
      <Content>
        <ProjectCashDataForm
          data={option.none}
          budget={fakeProject.budget}
          balance={fakeProject.balance}
          onSubmit={onSubmit}
          onCancel={props.onCancel}
        />
      </Content>
    )
  },
  args: {
    shouldFail: false
  }
}
