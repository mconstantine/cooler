import { Meta, Story } from '@storybook/react'
import { task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { ProjectForm as ProjectFormComponent } from '../../components/Form/Forms/ProjectForm'
import {
  LocalizedString,
  PositiveInteger,
  unsafePositiveInteger
} from '../../globalDomain'
import { CoolerStory } from '../CoolerStory'

interface FakeClient {
  id: PositiveInteger
  name: LocalizedString
}

const fakeClients: FakeClient[] = [
  {
    id: unsafePositiveInteger(1),
    name: unsafeLocalizedString('John Doe')
  },
  {
    id: unsafePositiveInteger(2),
    name: unsafeLocalizedString('Some Company')
  }
]

const findClients = (
  input: string
): TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>> => {
  const regex = new RegExp(input, 'i')

  return pipe(
    fakeClients
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

export const ProjectForm: Story = ({ onSubmit }) => {
  return (
    <CoolerStory>
      <Content>
        <ProjectFormComponent
          findClients={findClients}
          onSubmit={data => taskEither.fromIO(() => onSubmit(data))}
        />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Project Form',
  argTypes: {
    onSubmit: { action: 'submit' }
  }
}

export default meta
