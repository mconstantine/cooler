import { boolean, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { FC, useState } from 'react'
import { a18n } from '../../../a18n'
import { EmailString, LocalizedString } from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Form } from '../../Form/Form'
import { Input } from '../../Form/Input/Input/Input'
import { ReadonlyForm, ReadonlyItem } from '../../Form/ReadonlyForm'
import { useForm } from '../../Form/useForm'
import * as validators from '../../Form/validators'
import { Option } from 'fp-ts/Option'
import { skull } from 'ionicons/icons'

interface UserData {
  name: LocalizedString
  email: EmailString
}

interface UserUpdate extends UserData {
  newPassword: Option<NonEmptyString>
}

interface Props {
  user: UserData
  onDataChange: (data: UserUpdate) => TaskEither<LocalizedString, unknown>
  onLogout: () => void
  onDeleteProfile: TaskEither<LocalizedString, unknown>
}

export const UserData: FC<Props> = props => {
  const [isEditing, setIsEditing] = useState(false)

  const { fieldProps, formError, submit } = useForm(
    {
      initialValues: {
        name: props.user.name as string,
        email: props.user.email as string,
        newPassword: '',
        passwordConfirmation: ''
      },
      validators: () => ({
        name: validators.fromCodec(NonEmptyString, commonErrors.nonBlank),
        email: validators.fromCodec(EmailString, commonErrors.invalidEmail),
        newPassword: validators.optionalString(),
        passwordConfirmation: validators.optionalString()
      }),
      linters: () => ({})
    },
    {
      formValidator: data => {
        const defaultData = {
          name: (data.name as string) as LocalizedString,
          email: data.email,
          newPassword: option.none
        }

        return pipe(
          sequenceS(option.option)({
            password: data.newPassword,
            passwordConfirmation: data.passwordConfirmation
          }),
          option.fold(
            () =>
              taskEither.right({
                ...defaultData,
                newPassword: option.none
              }),
            flow(
              taskEither.fromPredicate(
                ({ password, passwordConfirmation }) =>
                  password === passwordConfirmation,
                () => a18n`Passwords don't match`
              ),
              taskEither.map(({ password }) => ({
                ...defaultData,
                newPassword: option.some(password)
              }))
            )
          )
        )
      }
    },
    {
      onSubmit: flow(
        props.onDataChange,
        taskEither.chain(() => taskEither.fromIO(() => setIsEditing(false)))
      )
    }
  )

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <ReadonlyForm
          title={a18n`Your data`}
          items={
            [
              {
                name: 'name',
                label: a18n`Name`,
                value: props.user.name
              },
              {
                name: 'email',
                label: a18n`E-mail address`,
                value: props.user.email
              }
            ] as ReadonlyItem<string>[]
          }
          buttons={[
            {
              type: 'button',
              label: a18n`Edit`,
              icon: option.none,
              action: () => setIsEditing(true),
              color: 'primary'
            },
            {
              type: 'button',
              label: a18n`Logout`,
              icon: option.none,
              action: props.onLogout,
              flat: true
            },
            {
              type: 'loading',
              label: a18n`Delete my account`,
              icon: skull,
              action: props.onDeleteProfile,
              color: 'danger',
              flat: true
            }
          ]}
        />
      ),
      () => (
        <Form
          title={a18n`Edit your data`}
          formError={formError}
          submit={submit}
          additionalButtons={[
            {
              type: 'button',
              label: a18n`Cancel`,
              icon: option.none,
              action: () => setIsEditing(false),
              flat: true
            }
          ]}
        >
          <Input
            label={a18n`Name`}
            {...fieldProps('name')}
            autoComplete="name"
          />
          <Input
            type="email"
            label={a18n`E-mail address`}
            {...fieldProps('email')}
            autoComplete="email"
          />
          <Input
            type="password"
            label={a18n`New password`}
            {...fieldProps('newPassword')}
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
    )
  )
}
