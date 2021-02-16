import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { NonEmptyString } from 'io-ts-types'
import { FC } from 'react'
import { a18n } from '../../../a18n'
import { EmailString, LocalizedString } from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Form } from '../Form'
import { Input } from '../Input/Input/Input'
import { useForm } from '../useForm'
import * as validators from '../validators'

export interface FormData {
  email: EmailString
  password: NonEmptyString
}

interface Props {
  onSubmit: ReaderTaskEither<FormData, LocalizedString, unknown>
}

export const LoginForm: FC<Props> = props => {
  const { fieldProps, submit, formError } = useForm(
    {
      initialValues: {
        email: '',
        password: ''
      },
      validators: () => ({
        email: validators.fromCodec(EmailString, commonErrors.invalidEmail),
        password: validators.nonBlankString(commonErrors.nonBlank)
      }),
      linters: () => ({})
    },
    {
      onSubmit: props.onSubmit
    }
  )

  return (
    <Form title={a18n`Login`} submit={submit} formError={formError}>
      <Input
        type="email"
        {...fieldProps('email')}
        label={a18n`E-mail address`}
        autoComplete="email"
      />
      <Input
        type="password"
        {...fieldProps('password')}
        label={a18n`Password`}
        autoComplete="new-password"
      />
    </Form>
  )
}
