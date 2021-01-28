import { Meta, Story } from '@storybook/react'
import { boolean, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import {
  TimesheetForm as TimesheetFormComponent,
  FormData
} from '../../components/Form/Forms/TimesheetForm'
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
