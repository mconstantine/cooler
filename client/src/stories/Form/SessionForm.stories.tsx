import { Meta, Story } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { SessionForm as SessionFormComponent } from '../../components/Form/Forms/SessionForms'
import { SessionCreationInput } from '../../entities/Session'
import { CoolerStory } from '../CoolerStory'
import { findTasks } from '../utils'

interface Args {
  shouldFail: boolean
  onSubmit: (data: SessionCreationInput) => void
}

const SessionFormTemplate: Story<Args> = props => {
  const onSubmit = (data: SessionCreationInput) =>
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
        <SessionFormComponent
          session={option.none}
          findTasks={option.some(findTasks)}
          onSubmit={onSubmit}
        />
      </Content>
    </CoolerStory>
  )
}

export const SessionForm = SessionFormTemplate.bind({})

SessionForm.args = {
  shouldFail: false
}

SessionForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    control: 'boolean',
    description: 'Set this to true to make the form submission fail'
  },
  onSubmit: { action: 'submit' }
}

const meta: Meta = {
  title: 'Cooler/Form/Session Form'
}

export default meta
