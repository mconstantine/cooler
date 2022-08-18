import { option } from 'fp-ts'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { a18n } from '../../../a18n'
import {
  LocalizedString,
  NonNegativeNumber,
  NonNegativeNumberFromString
} from '../../../globalDomain'
import { Form } from '../Form'
import { DateTimePicker } from '../Input/DateTimePicker/DateTimePicker'
import { Input } from '../Input/Input/Input'
import { useForm } from '../useForm'
import * as validators from '../validators'

export interface FormData {
  startTime: Date
  hoursCount: NonNegativeNumber
}

interface Props {
  startTime: Date
  onSubmit: ReaderTaskEither<FormData, LocalizedString, unknown>
  onCancel: IO<unknown>
}

export function AddWorkingHoursForm(props: Props) {
  const { formError, submit, fieldProps } = useForm(
    {
      initialValues: {
        startTime: props.startTime,
        hoursCount: '0'
      },
      validators: () => ({
        hoursCount: validators.fromCodec(
          NonNegativeNumberFromString,
          a18n`Working hours cannot be less than zero`
        )
      }),
      linters: () => ({})
    },
    {
      onSubmit: props.onSubmit
    }
  )

  return (
    <Form
      title={a18n`Add working hours`}
      actions={option.none}
      formError={formError}
      submit={submit}
      additionalButtons={[
        {
          type: 'button',
          label: a18n`Cancel`,
          icon: option.none,
          action: props.onCancel
        }
      ]}
    >
      <DateTimePicker
        mode="datetime"
        {...fieldProps('startTime')}
        label={a18n`Starting at`}
      />
      <Input
        type="number"
        label={a18n`Hours count`}
        {...fieldProps('hoursCount')}
      />
    </Form>
  )
}
