import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { FC } from 'react'
import { CashData, Project } from '../../../entities/Project'
import {
  LocalizedString,
  NonNegativeNumberFromString
} from '../../../globalDomain'
import * as t from 'io-ts'
import { useForm } from '../useForm'
import * as validators from '../validators'
import { commonErrors } from '../../../misc/commonErrors'
import { Form } from '../Form'
import { a18n } from '../../../a18n'
import { SimpleSelect } from '../Input/SimpleSelect'
import { DateTimePicker } from '../Input/DateTimePicker/DateTimePicker'
import { Input } from '../Input/Input/Input'
import { pipe } from 'fp-ts/function'
import { option } from 'fp-ts'
import { Option } from 'fp-ts/Option'

interface Props {
  data: Option<CashData>
  budget: Project['budget']
  balance: Project['balance']
  onSubmit: ReaderTaskEither<CashData, LocalizedString, unknown>
  onCancel: IO<void>
}

const CashBalanceTypeValues = {
  budget: a18n`Budget`,
  balance: a18n`Balance`,
  custom: a18n`Custom`
}
const CashBalanceType = t.keyof(CashBalanceTypeValues, 'CashBalanceType')
type CashBalanceType = t.TypeOf<typeof CashBalanceType>

function foldCashBalanceType<T>(
  whenBudget: () => T,
  whenBalance: () => T,
  whenCustom: () => T
): (type: CashBalanceType) => T {
  return type => {
    switch (type) {
      case 'budget':
        return whenBudget()
      case 'balance':
        return whenBalance()
      case 'custom':
        return whenCustom()
    }
  }
}

export const ProjectCashDataForm: FC<Props> = props => {
  const { fieldProps, formError, submit, values, setValues } = useForm(
    {
      initialValues: {
        type: pipe(
          props.data,
          option.fold<CashData, CashBalanceType>(
            () => 'balance',
            data => {
              if (data.balance === props.budget) {
                return 'budget'
              } else if (data.balance === props.balance) {
                return 'balance'
              } else {
                return 'custom'
              }
            }
          )
        ),
        at: pipe(
          props.data,
          option.map(data => data.at),
          option.getOrElse(() => new Date())
        ),
        balance: pipe(
          props.data,
          option.map(data => data.balance.toString(10)),
          option.getOrElse(() => props.balance.toString(10))
        )
      },
      validators: () => ({
        balance: validators.fromCodec(
          NonNegativeNumberFromString,
          commonErrors.moneyAmount
        )
      }),
      linters: () => ({})
    },
    {
      onSubmit: props.onSubmit
    }
  )

  const onCashBalanceTypeChange = (type: CashBalanceType) => {
    setValues({
      type,
      balance: pipe(
        type,
        foldCashBalanceType(
          () => props.budget.toString(10),
          () => props.balance.toString(10),
          () => values.balance
        )
      )
    })
  }

  return (
    <Form
      title={a18n`Cash project`}
      headingAction={option.none}
      formError={formError}
      submit={submit}
      additionalButtons={[
        {
          type: 'button',
          label: a18n`Cancel`,
          action: props.onCancel,
          icon: option.none
        }
      ]}
    >
      <DateTimePicker
        label={a18n`Cashed at`}
        {...fieldProps('at')}
        mode="date"
      />
      <SimpleSelect
        label={a18n`Cashed amount`}
        {...fieldProps('type')}
        onChange={onCashBalanceTypeChange}
        options={CashBalanceTypeValues}
      />
      <Input
        type="number"
        label={a18n`Cashed balance`}
        {...fieldProps('balance')}
        disabled={values.type !== 'custom'}
      />
    </Form>
  )
}
