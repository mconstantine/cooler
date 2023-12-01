import { Meta, StoryObj } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { unsafeLocalizedString } from '../../a18n'
import { Content } from '../../components/Content/Content'
import { TaxForm } from '../../components/Form/Forms/TaxForm'
import { TaxCreationInput } from '../../entities/Tax'
import { ComponentProps } from 'react'

interface TaxFormArgs extends ComponentProps<typeof TaxForm> {
  shouldFail: boolean
}

const meta: Meta<TaxFormArgs> = {
  title: 'Cooler/Forms/TaxForm',
  component: TaxForm,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    shouldFail: {
      name: 'Should fail',
      control: 'boolean',
      description: 'Set this to true to make the form submission fail'
    }
  }
}

export default meta
type Story = StoryObj<TaxFormArgs>

export const Default: Story = {
  render: props => {
    const onSubmit = (data: TaxCreationInput) =>
      pipe(
        props.shouldFail,
        boolean.fold(
          () => taskEither.rightIO(() => props.onSubmit(data)),
          () => taskEither.left(unsafeLocalizedString("I'm an error!"))
        )
      )

    return (
      <Content>
        <TaxForm tax={option.none} onSubmit={onSubmit} onCancel={option.none} />
      </Content>
    )
  },
  args: {
    shouldFail: false
  }
}
