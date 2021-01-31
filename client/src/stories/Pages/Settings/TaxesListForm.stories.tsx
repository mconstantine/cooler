import { Meta, Story } from '@storybook/react'
import { array, boolean, task, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { TaxesListForm as TaxesListFormComponent } from '../../../components/Pages/Settings/TaxesListForm'
import { eqTax, Tax, TaxCreationInput } from '../../../entities/Tax'
import {
  LocalizedString,
  unsafePercentage,
  unsafePositiveInteger
} from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'

interface Args {
  shouldFail: boolean
}

const TaxesListFormTemplate: Story<Args> = props => {
  const [taxes, setTaxes] = useState<Tax[]>([
    {
      id: unsafePositiveInteger(0),
      label: unsafeLocalizedString('Some tax'),
      value: unsafePercentage(0.2572)
    },
    {
      id: unsafePositiveInteger(1),
      label: unsafeLocalizedString('Some other tax'),
      value: unsafePercentage(0.1005)
    }
  ])

  const addTax = (tax: TaxCreationInput) => {
    setTaxes(taxes => [
      ...taxes,
      {
        id: unsafePositiveInteger(Math.max(...taxes.map(tax => tax.id)) + 1),
        ...tax
      }
    ])
  }

  const updateTax = (target: Tax) => {
    setTaxes(
      flow(
        array.map(tax =>
          pipe(
            eqTax.equals(tax, target),
            boolean.fold(
              () => tax,
              () => target
            )
          )
        )
      )
    )
  }

  const deleteTax = (target: Tax) => {
    setTaxes(taxes => taxes.filter(tax => !eqTax.equals(target, tax)))
  }

  const onTaxAdd: ReaderTaskEither<
    TaxCreationInput,
    LocalizedString,
    void
  > = tax =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          pipe(
            task.fromIO(() => addTax(tax)),
            task.delay(500),
            taskEither.rightTask
          ),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  const onTaxUpdate: ReaderTaskEither<Tax, LocalizedString, void> = tax =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          pipe(
            task.fromIO(() => updateTax(tax)),
            task.delay(500),
            taskEither.rightTask
          ),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  const onTaxDelete: ReaderTaskEither<Tax, LocalizedString, void> = tax =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          pipe(
            task.fromIO(() => deleteTax(tax)),
            task.delay(500),
            taskEither.rightTask
          ),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  return (
    <CoolerStory>
      <Content>
        <TaxesListFormComponent
          taxes={taxes}
          onTaxAdd={onTaxAdd}
          onTaxUpdate={onTaxUpdate}
          onTaxDelete={onTaxDelete}
        />
      </Content>
    </CoolerStory>
  )
}

export const TaxesListForm = TaxesListFormTemplate.bind({})

TaxesListForm.args = {
  shouldFail: false
}

TaxesListForm.argTypes = {
  shouldFail: {
    name: 'Should fail',
    description:
      'Set this to true to make the next operation (add, update, delete) fail',
    control: 'boolean'
  }
}

const meta: Meta = {
  title: 'Cooler/Pages/Settings/Taxes List Form'
}

export default meta
