import { Meta, Story } from '@storybook/react'
import { boolean, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import {
  FormData,
  TaxForm as TaxFormComponent
} from '../../components/Form/Forms/TaxForm'
import { CoolerStory } from '../CoolerStory'

interface Args {
  shouldFail: boolean
  onSubmit: (data: FormData) => void
}

const TaxFormTemplate: Story<Args> = props => {
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
        <TaxFormComponent onSubmit={onSubmit} />
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
