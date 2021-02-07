import { Meta, Story } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { ProjectCashDataForm as ProjectCashDataFormComponent } from '../../components/Form/Forms/ProjectCashDataForm'
import { CashData } from '../../entities/Project'
import { CoolerStory } from '../CoolerStory'
import { fakeProject } from '../utils'

interface Args {
  shouldFail: boolean
  onSubmit: (data: CashData) => void
  onCancel: IO<void>
}

const ProjectCashDataFormTemplate: Story<Args> = props => {
  const onSubmit = (data: CashData) =>
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
        <ProjectCashDataFormComponent
          data={option.none}
          budget={fakeProject.budget}
          balance={fakeProject.balance}
          onSubmit={onSubmit}
          onCancel={props.onCancel}
        />
      </Content>
    </CoolerStory>
  )
}

export const ProjectCashDataForm = ProjectCashDataFormTemplate.bind({})

ProjectCashDataForm.args = {
  shouldFail: false
}

ProjectCashDataForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    control: 'boolean',
    description: 'Set this to true to make the form submission fail'
  },
  onSubmit: { action: 'submit' },
  onCancel: { action: 'cancel' }
}

const meta: Meta = {
  title: 'Cooler/Form/Project Cash Data Form'
}

export default meta
