import { boolean, option, taskEither } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { FC, useState } from 'react'
import { a18n } from '../../../a18n'
import {
  LocalizedString,
  NonNegativeNumber,
  NonNegativeNumberFromString,
  OptionFromEmptyString,
  PositiveInteger,
  PositiveIntegerFromString
} from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Form } from '../Form'
import { DateTimePicker } from '../Input/DateTimePicker/DateTimePicker'
import { toSelectState } from '../Input/Select/Select'
import { TextArea } from '../Input/TextArea/TextArea'
import { Toggle } from '../Input/Toggle/Toggle'
import { useForm } from '../useForm'
import * as validators from '../validators'
import { Input } from '../Input/Input/Input'
import { AsyncSelect } from '../Input/AsyncSelect'

interface FormData {
  name: NonEmptyString
  description: Option<NonEmptyString>
  client: PositiveInteger
  cashedAt: Date
  cashedBalance: NonNegativeNumber
}

interface ValidatedFormData {
  name: NonEmptyString
  description: Option<NonEmptyString>
  client: PositiveInteger
  cashed: Option<{
    at: Date
    balance: NonNegativeNumber
  }>
}

interface Props {
  findClients: (
    input: string
  ) => TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>>
  onSubmit: (data: ValidatedFormData) => TaskEither<LocalizedString, unknown>
}

export const ProjectForm: FC<Props> = props => {
  const [cashed, setCashed] = useState(false)

  const formValidator: validators.Validator<
    FormData,
    ValidatedFormData
  > = input => {
    return pipe(
      cashed,
      boolean.fold(
        () => option.none,
        () =>
          option.some({
            at: input.cashedAt,
            balance: input.cashedBalance
          })
      ),
      cashed => ({
        name: input.name,
        description: input.description,
        client: input.client,
        cashed
      }),
      taskEither.right
    )
  }

  const { fieldProps, submit, formError } = useForm({
    initialValues: {
      name: '',
      description: '',
      client: toSelectState<PositiveInteger>({}, option.none),
      cashedAt: new Date(),
      cashedBalance: ''
    },
    validators: {
      name: validators.nonBlankString(commonErrors.nonBlank),
      description: validators.fromCodec<Option<NonEmptyString>>(
        OptionFromEmptyString,
        commonErrors.nonBlank
      ),
      client: validators.fromSelectState<PositiveInteger>(
        a18n`Please choose a client`
      ),
      cashedBalance: pipe(
        cashed,
        boolean.fold(
          () => validators.passThrough<string, NonNegativeNumber>(),
          () =>
            validators.fromCodec<NonNegativeNumber>(
              NonNegativeNumberFromString,
              commonErrors.moneyAmount
            )
        )
      )
    },
    linters: {},
    formValidator,
    onSubmit: props.onSubmit
  })

  return (
    <Form title={a18n`New Project`} submit={submit} formError={formError}>
      <Input label={a18n`New Project`} {...fieldProps('name')} />
      <TextArea label={a18n`Description`} {...fieldProps('description')} />
      <AsyncSelect
        label={a18n`Client`}
        {...fieldProps('client')}
        onQueryChange={props.findClients}
        emptyPlaceholder={a18n`No clients found`}
        codec={PositiveIntegerFromString}
      />

      <Toggle
        name="cashed"
        label={a18n`Cashed`}
        value={cashed}
        onChange={setCashed}
        error={option.none}
        warning={option.none}
      />

      {pipe(
        cashed,
        boolean.fold(constNull, () => (
          <>
            <DateTimePicker
              label={a18n`Cashed on`}
              {...fieldProps('cashedAt')}
              mode="date"
            />
            <Input
              label={a18n`Cashed balance`}
              {...fieldProps('cashedBalance')}
            />
          </>
        ))
      )}
    </Form>
  )
}
