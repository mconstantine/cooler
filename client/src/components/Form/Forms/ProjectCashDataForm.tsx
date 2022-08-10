import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { ProjectCashData, ProjectWithStats } from '../../../entities/Project'
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
  data: Option<ProjectCashData>
  budget: ProjectWithStats['budget']
  balance: ProjectWithStats['balance']
  onSubmit: ReaderTaskEither<ProjectCashData, LocalizedString, unknown>
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

export function ProjectCashDataForm(props: Props) {
  const { fieldProps, formError, submit, values, setValues } = useForm(
    {
      initialValues: {
        type: pipe(
          props.data,
          option.fold<ProjectCashData, CashBalanceType>(
            () => 'balance',
            data => {
              if (data.amount === props.budget) {
                return 'budget'
              } else if (data.amount === props.balance) {
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
        amount: pipe(
          props.data,
          option.map(data => data.amount.toString(10)),
          option.getOrElse(() => props.balance.toString(10))
        )
      },
      validators: () => ({
        amount: validators.fromCodec(
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
      amount: pipe(
        type,
        foldCashBalanceType(
          () => props.budget.toString(10),
          () => props.balance.toString(10),
          () => values.amount
        )
      )
    })
  }

  return (
    <Form
      title={a18n`Cash project`}
      actions={option.none}
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
        {...fieldProps('amount')}
        disabled={values.type !== 'custom'}
      />
    </Form>
  )
}
