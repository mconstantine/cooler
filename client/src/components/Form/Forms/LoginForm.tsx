import { option } from 'fp-ts'
import { constNull, constUndefined, identity, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { ComponentProps, FC } from 'react'
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

export type FormData = RegistrationData | LoginData

function foldFormData<T>(
  whenRegister: (data: RegistrationData) => T,
  whenLogin: (data: LoginData) => T
): (data: FormData) => T {
  return data => {
    switch (data.type) {
      case 'Register':
        return whenRegister(data)
      case 'Login':
        return whenLogin(data)
    }
  }
}

interface Props {
  onSubmit: (data: FormData) => TaskEither<LocalizedString, unknown>
}

export const LoginForm: FC<Props> = props => {
  const { fieldProps, submit, formError } = useForm(
    {
      initialValues: {
        type: 'Login' as FormType,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password',
        passwordConfirmation: 'password'
      },
      validators: ({ type }) => ({
        name: pipe(
          type,
          foldFormType(
            () => validators.nonBlankString(commonErrors.nonBlank),
            constUndefined
          )
        ),
        email: validators.fromCodec(EmailString, commonErrors.invalidEmail),
        password: validators.nonBlankString(commonErrors.nonBlank),
        passwordConfirmation: pipe(
          type,
          foldFormType(
            () => validators.nonBlankString(commonErrors.nonBlank),
            constUndefined
          )
        )
      }),
      linters: () => ({})
    },
    {
      formValidator: data =>
        pipe(
          data as FormData,
          foldFormData(
            validators.fromPredicate(
              ({ password, passwordConfirmation }) =>
                password === passwordConfirmation,
              a18n`The passwords don't match`
            ),
            validators.passThrough<FormData>()
          )
        )
    },
    {
      onSubmit: data =>
        pipe(
          data,
          foldFormData<FormData>(identity, data => ({
            type: 'Login',
            email: data.email,
            password: data.password
          })),
          props.onSubmit
        )
    }
  )

  const { value: formType, onChange: setFormType } = fieldProps('type')

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
          constNull
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
          constNull
        )
      )}
    </Form>
  )
}
