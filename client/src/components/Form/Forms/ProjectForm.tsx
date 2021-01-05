import { boolean, either, option, taskEither } from 'fp-ts'
import { constFalse, constNull, pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { FC } from 'react'
import { a18n } from '../../../a18n'
import {
  BooleanFromString,
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
import { NumberInput } from '../Input/NumberInput/NumberInput'
import { Select } from '../Input/Select/Select'
import { TextArea } from '../Input/TextArea/TextArea'
import { TextInput } from '../Input/TextInput/TextInput'
import { Toggle } from '../Input/Toggle/Toggle'
import { useForm } from '../useForm'
import * as validators from '../validators'

interface FormData {
  name: NonEmptyString
  description: Option<NonEmptyString>
  client: PositiveInteger
  cashed: boolean
  cashedAt: string
  cashedBalance: string
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

const formValidator: validators.Validator<
  FormData,
  ValidatedFormData
> = input => {
  return pipe(
    input.cashed,
    boolean.fold(
      () => either.right(option.none),
      () =>
        pipe(
          sequenceS(option.option)({
            at: pipe(
              input.cashedAt,
              DateFromISOString.decode,
              option.fromEither
            ),
            balance: pipe(
              input.cashedBalance,
              NonNegativeNumberFromString.decode,
              option.fromEither
            )
          }),
          either.fromOption(
            () =>
              a18n`If the project was cashed, you need to provide a valid date and balance`
          ),
          either.map(option.some)
        )
    ),
    either.map(cashed => ({
      name: input.name,
      description: input.description,
      client: input.client,
      cashed
    })),
    taskEither.fromEither
  )
}

export const ProjectForm: FC<Props> = props => {
  const { fieldProps, submit, formError } = useForm({
    initialValues: {
      name: '',
      description: '',
      client: '',
      cashed: 'false',
      cashedAt: new Date().toISOString(),
      cashedBalance: ''
    },
    validators: {
      name: validators.nonBlankString(commonErrors.nonBlank),
      description: validators.fromCodec<Option<NonEmptyString>>(
        OptionFromEmptyString,
        commonErrors.nonBlank
      ),
      client: validators.fromCodec<PositiveInteger>(
        PositiveIntegerFromString,
        a18n`Please choose a client`
      ),
      cashed: validators.fromCodec<BooleanFromString>(
        BooleanFromString,
        commonErrors.boolean
      ),
      cashedAt: validators.passThrough<string>(),
      cashedBalance: validators.passThrough<string>()
    },
    linters: {},
    formValidator,
    onSubmit: props.onSubmit
  })

  const cashedProps = fieldProps('cashed')

  return (
    <Form title={a18n`New Project`} submit={submit} formError={formError}>
      <TextInput label={a18n`New Project`} {...fieldProps('name')} />
      <TextArea label={a18n`Description`} {...fieldProps('description')} />
      <Select
        label={a18n`Client`}
        {...fieldProps('client')}
        options={{}}
        findOptions={props.findClients}
      />

      <Toggle label={a18n`Cashed`} {...cashedProps} />

      {pipe(
        cashedProps.value,
        BooleanFromString.decode,
        either.getOrElse(constFalse),
        boolean.fold(constNull, () => (
          <>
            <DateTimePicker
              label={a18n`Cashed on`}
              {...fieldProps('cashedAt')}
              mode="date"
            />
            <NumberInput
              label={a18n`Cashed balance`}
              {...fieldProps('cashedBalance')}
            />
          </>
        ))
      )}
    </Form>
  )
}
