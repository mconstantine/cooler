import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { NonEmptyString } from 'io-ts-types'
import { FC } from 'react'
import { a18n } from '../../../a18n'
import {
  LocalizedString,
  Percentage,
  PercentageFromString
} from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Body } from '../../Body/Body'
import { Form } from '../Form'
import { Input } from '../Input/Input/Input'
import { useForm } from '../useForm'
import * as validators from '../validators'

export interface FormData {
  label: NonEmptyString
  value: Percentage
}

interface Props {
  onSubmit: ReaderTaskEither<FormData, LocalizedString, unknown>
}

export const TaxForm: FC<Props> = props => {
  const { fieldProps, formError, submit } = useForm(
    {
      initialValues: {
        label: '',
        value: ''
      },
      validators: () => ({
        label: validators.nonBlankString(commonErrors.nonBlank),
        value: validators.fromCodec(
          PercentageFromString,
          a18n`Tax value should be a percentage`
        )
      }),
      linters: () => ({})
    },
    {
      onSubmit: props.onSubmit
    }
  )

  return (
    <Form title={a18n`New Tax`} formError={formError} submit={submit}>
      <Input label={a18n`Name`} {...fieldProps('label')} />
      <Input label={a18n`Value (%)`} {...fieldProps('value')} />
      <Body>
        {a18n`Tax value is the percentage amount of your income you have to pay. For example, if you had to pay €25 every €100 earned, the value would be 25`}
      </Body>
    </Form>
  )
}
