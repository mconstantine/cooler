import { Meta, Story } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { TaxForm as TaxFormComponent } from '../../components/Form/Forms/TaxForm'
import { TaxCreationInput } from '../../entities/Tax'
import { CoolerStory } from '../CoolerStory'

interface Args {
  shouldFail: boolean
  onSubmit: (data: TaxCreationInput) => void
}

const TaxFormTemplate: Story<Args> = props => {
  const onSubmit = (data: TaxCreationInput) =>
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
        <TaxFormComponent
          tax={option.none}
          onSubmit={onSubmit}
          onCancel={option.none}
        />
      </Content>
    </CoolerStory>
  )
}

export const TaxForm = TaxFormTemplate.bind({})

TaxForm.args = {
  shouldFail: false
}

TaxForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    control: 'boolean',
    description: 'Set this to true to make the form submission fail'
  },
  onSubmit: { action: 'submit' }
}

const meta: Meta = {
  title: 'Cooler/Form/Tax Form'
}

export default meta
