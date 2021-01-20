import { Meta, Story } from '@storybook/react'
import { task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { TimesheetForm as TimesheetFormComponent } from '../../components/Form/Forms/TimesheetForm'
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

export const TimesheetForm: Story = ({ onSubmit }) => {
  return (
    <CoolerStory>
      <Content>
        <TimesheetFormComponent
          findProjects={findProjects}
          onSubmit={data => taskEither.fromIO(() => onSubmit(data))}
        />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Timesheet Form',
  argTypes: {
    onSubmit: {
      action: 'submit'
    }
  }
}

export default meta
