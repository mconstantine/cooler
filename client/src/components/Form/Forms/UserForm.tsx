import { option, taskEither } from 'fp-ts'
import { sequenceS } from 'fp-ts/Apply'
import { flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { FC } from 'react'
import { a18n } from '../../../a18n'
import { User } from '../../../entities/User'
import { EmailString, LocalizedString } from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Form } from '../Form'
import { Input } from '../Input/Input/Input'
import { useForm } from '../useForm'
import * as validators from '../validators'

export interface UserUpdate extends Pick<User, 'name' | 'email'> {
  password: Option<NonEmptyString>
}

interface Props {
  user: User
  onSubmit: (data: UserUpdate) => TaskEither<LocalizedString, unknown>
  onCancel: IO<void>
}

export const UserForm: FC<Props> = props => {
  const { fieldProps, formError, submit } = useForm(
    {
      initialValues: {
        name: props.user.name as string,
        email: props.user.email as string,
        password: '',
        passwordConfirmation: '',
        created_at: props.user.created_at,
        updated_at: props.user.updated_at
      },
      validators: () => ({
        name: validators.fromCodec(NonEmptyString, commonErrors.nonBlank),
        email: validators.fromCodec(EmailString, commonErrors.invalidEmail),
        password: validators.optionalString(),
        passwordConfirmation: validators.optionalString()
      }),
      linters: () => ({})
    },
    {
      formValidator: data => {
        const defaultData = {
          name: (data.name as string) as LocalizedString,
          email: data.email
        }

        return pipe(
          sequenceS(option.option)({
            password: data.password,
            passwordConfirmation: data.passwordConfirmation
          }),
          option.fold(
            () =>
              taskEither.right({
                ...defaultData,
                password: option.none
              }),
            flow(
              taskEither.fromPredicate(
                ({ password, passwordConfirmation }) =>
                  password === passwordConfirmation,
                () => a18n`Passwords don't match`
              ),
              taskEither.map(({ password }) => ({
                ...defaultData,
                password: option.some(password)
              }))
            )
          )
        )
      }
    },
    {
      onSubmit: data => props.onSubmit(data)
    }
  )

  return (
    <Form
      title={a18n`Edit your data`}
      formError={formError}
      submit={submit}
      additionalButtons={[
        {
          type: 'button',
          label: a18n`Cancel`,
          icon: option.none,
          action: props.onCancel,
          flat: true
        }
      ]}
    >
      <Input label={a18n`Name`} {...fieldProps('name')} autoComplete="name" />
      <Input
        type="email"
        label={a18n`E-mail address`}
        {...fieldProps('email')}
        autoComplete="email"
      />
      <Input
        type="password"
        label={a18n`New password`}
        {...fieldProps('password')}
        autoComplete="new-password"
      />
      <Input
        type="password"
        label={a18n`New password (again)`}
        {...fieldProps('passwordConfirmation')}
        autoComplete="new-password"
      />
    </Form>
  )
}
