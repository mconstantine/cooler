import { Meta, StoryObj } from '@storybook/react'
import { boolean, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import {
  TimesheetForm,
  FormData
} from '../../components/Form/Forms/TimesheetForm'
import { findProjects } from '../utils'
import { ComponentProps } from 'react'

interface TimesheetFormArgs extends ComponentProps<typeof TimesheetForm> {
  shouldFail: boolean
}

const meta: Meta<TimesheetFormArgs> = {
  title: 'Cooler/Forms/TimesheetForm',
  component: TimesheetForm,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    shouldFail: {
      name: 'Should fail',
      control: 'boolean',
      description: 'Set this to true to make the form submission fail'
    },
    onSubmit: { action: 'submit' }
  }
}

export default meta
type Story = StoryObj<TimesheetFormArgs>

export const Default: Story = {
  render: props => {
    const onSubmit = (data: FormData) =>
      pipe(
        props.shouldFail,
        boolean.fold(
          () => taskEither.rightIO(() => props.onSubmit(data)),
          () => taskEither.left(unsafeLocalizedString("I'm an error!"))
        )
      )

    return (
      <Content>
        <TimesheetForm findProjects={findProjects} onSubmit={onSubmit} />
      </Content>
    )
  },
  args: {
    shouldFail: false
  }
}
