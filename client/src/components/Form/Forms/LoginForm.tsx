import { option, taskEither } from 'fp-ts'
import { constUndefined, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { ComponentProps, FC, useState } from 'react'
import { a18n } from '../../../a18n'
import { EmailString, LocalizedString } from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Button } from '../../Button/Button/Button'
import { Form } from '../Form'
import { Input } from '../Input/Input/Input'
import { useForm } from '../useForm'
import * as validators from '../validators'

type FormType = 'Register' | 'Login'

function foldFormType<T>(
  whenRegister: () => T,
  whenLogin: () => T
): (type: FormType) => T {
  return type => {
    switch (type) {
      case 'Register':
        return whenRegister()
      case 'Login':
        return whenLogin()
    }
  }
}

interface RegistrationData {
  type: 'Register'
  name: NonEmptyString
  email: EmailString
  password: NonEmptyString
  passwordConfirmation: NonEmptyString
}

interface LoginData {
  type: 'Login'
  email: EmailString
  password: NonEmptyString
}

export type SubmitData =
  | Omit<RegistrationData, 'passwordConfirmation'>
  | LoginData

interface Props {
  onSubmit: (data: SubmitData) => TaskEither<LocalizedString, unknown>
}

interface ValidatedData {
  name: NonEmptyString | string
  email: EmailString
  password: NonEmptyString
  passwordConfirmation: NonEmptyString | string
}

export const LoginForm: FC<Props> = props => {
  const [formType, setFormType] = useState<FormType>('Login')

  const formValidator: validators.Validator<ValidatedData> | undefined = pipe(
    formType,
    foldFormType(
      () =>
        taskEither.fromPredicate(
          values => values.password === values.passwordConfirmation,
          () => a18n`The passwords don't match`
        ),
      constUndefined
    )
  )

  const { fieldProps, submit, formError } = useForm({
    initialValues: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password',
      passwordConfirmation: 'password'
    },
    validators: {
      name: pipe(
        formType,
        foldFormType(
          () => validators.nonBlankString(commonErrors.nonBlank),
          constUndefined
        )
      ),
      email: validators.fromCodec<EmailString>(
        EmailString,
        commonErrors.invalidEmail
      ),
      password: validators.nonBlankString(commonErrors.nonBlank),
      passwordConfirmation: pipe(
        formType,
        foldFormType(
          () => validators.nonBlankString(commonErrors.nonBlank),
          constUndefined
        )
      )
    },
    linters: {},
    formValidator,
    onSubmit: ({ name, email, password }) =>
      pipe(
        formType,
        foldFormType<SubmitData>(
          () => ({
            type: 'Register',
            name: name as NonEmptyString,
            email,
            password
          }),
          () => ({
            type: 'Login',
            email,
            password
          })
        ),
        props.onSubmit
      )
  })

  const title = pipe(
    formType,
    foldFormType(
      () => a18n`Register`,
      () => a18n`Login`
    )
  )

  const altTitle = pipe(
    formType,
    foldFormType(
      () => a18n`Login`,
      () => a18n`Register`
    )
  )

  const additionalButtons: Array<ComponentProps<typeof Button>> = [
    pipe(
      formType,
      foldFormType(
        () => ({
          type: 'button',
          label: altTitle,
          action: () => setFormType('Login'),
          icon: option.none,
          color: 'primary',
          flat: true
        }),
        () => ({
          type: 'button',
          label: altTitle,
          action: () => setFormType('Register'),
          icon: option.none,
          color: 'primary',
          flat: true
        })
      )
    )
  ]

  return (
    <Form
      title={title}
      submit={submit}
      submitLabel={title}
      formError={formError}
      additionalButtons={additionalButtons}
    >
      {pipe(
        formType,
        foldFormType(
          () => (
            <Input
              {...fieldProps('name')}
              label={a18n`Full name`}
              autoComplete="name"
            />
          ),
          () => null
        )
      )}
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
      {pipe(
        formType,
        foldFormType(
          () => (
            <Input
              type="password"
              {...fieldProps('passwordConfirmation')}
              label={a18n`Password (again)`}
              autoComplete="off"
            />
          ),
          () => null
        )
      )}
    </Form>
  )
}
