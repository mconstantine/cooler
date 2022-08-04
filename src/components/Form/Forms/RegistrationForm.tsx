import { option } from 'fp-ts'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { NonEmptyString } from 'io-ts-types'
import { warning } from 'ionicons/icons'
import { a18n } from '../../../a18n'
import { EmailString, LocalizedString } from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Banner } from '../../Banner/Banner'
import { Body } from '../../Body/Body'
import { Panel } from '../../Panel/Panel'
import { Form } from '../Form'
import { Input } from '../Input/Input/Input'
import { useForm } from '../useForm'
import * as validators from '../validators'

export interface FormData {
  name: NonEmptyString
  email: EmailString
  password: NonEmptyString
}

interface Props {
  onLoginLinkClick: IO<void>
  onSubmit: ReaderTaskEither<FormData, LocalizedString, unknown>
}

export function RegistrationForm(props: Props) {
  const { fieldProps, submit, formError } = useForm(
    {
      initialValues: {
        name: '',
        email: '',
        password: ''
      },
      validators: () => ({
        name: validators.nonBlankString(commonErrors.nonBlank),
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
    <>
      <Panel color="warning" action={option.none} framed>
        <Banner
          icon={warning}
          content={a18n`Only existing users can register new users, unless there are no users registered.`}
        />
      </Panel>
      <Form
        title={a18n`Register`}
        headingAction={option.none}
        submit={submit}
        formError={formError}
      >
        <Input
          {...fieldProps('name')}
          label={a18n`Full name`}
          autoComplete="name"
        />
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
      <Body color="primary" onClick={props.onLoginLinkClick}>
        {a18n`Or login`}
      </Body>
    </>
  )
}
