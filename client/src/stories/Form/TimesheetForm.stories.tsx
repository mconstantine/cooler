import { Meta, Story } from '@storybook/react'
import { boolean, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import {
  TimesheetForm as TimesheetFormComponent,
  FormData
} from '../../components/Form/Forms/TimesheetForm'
import { CoolerStory } from '../CoolerStory'
import { findProjects } from '../utils'

interface Args {
  shouldFail: boolean
  onSubmit: (data: FormData) => void
}

const TimesheetFormTemplate: Story<Args> = props => {
  const onSubmit = (data: FormData) =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () => taskEither.rightIO(() => props.onSubmit(data)),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  return (
    <CoolerStory>
      <Content>
        <TimesheetFormComponent
          findProjects={findProjects}
          onSubmit={onSubmit}
        />
      </Content>
    </CoolerStory>
  )
}

export const TimesheetForm = TimesheetFormTemplate.bind({})

TimesheetForm.args = {
  shouldFail: false
}

TimesheetForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    control: 'boolean',
    description: 'Set this to true to make the form submission fail'
  },
  onSubmit: { action: 'submit' }
}

const meta: Meta = {
  title: 'Cooler/Form/Timesheet Form'
}

export default meta
