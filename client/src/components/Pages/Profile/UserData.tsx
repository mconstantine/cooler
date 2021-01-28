import { boolean, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { FC, useState } from 'react'
import { a18n, formatDateTime } from '../../../a18n'
import { EmailString, LocalizedString } from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { Form } from '../../Form/Form'
import { Input } from '../../Form/Input/Input/Input'
import { useForm } from '../../Form/useForm'
import * as validators from '../../Form/validators'
import { Option } from 'fp-ts/Option'
import { Panel } from '../../Panel/Panel'
import { List } from '../../List/List'
import { Buttons } from '../../Button/Buttons/Buttons'
import { Button } from '../../Button/Button/Button'
import { LoadingButton } from '../../Button/LoadingButton/LoadingButton'
import { skull } from 'ionicons/icons'

interface UserData {
  name: LocalizedString
  email: EmailString
  created_at: Date
  updated_at: Date
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
        passwordConfirmation: '',
        created_at: props.user.created_at,
        updated_at: props.user.updated_at
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
          newPassword: option.none,
          created_at: data.created_at,
          updated_at: data.updated_at
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
        <Panel title={a18n`Your data`} framed>
          <List
            heading={option.none}
            items={[
              {
                type: 'readonly',
                key: 'name',
                label: option.some(a18n`Name`),
                content: props.user.name,
                description: option.none
              },
              {
                type: 'readonly',
                key: 'email',
                label: option.some(a18n`E-mail address`),
                content: (props.user.email as unknown) as LocalizedString,
                description: option.none
              },
              {
                type: 'readonly',
                key: 'created_at',
                label: option.some(a18n`Created at`),
                content: formatDateTime(props.user.created_at),
                description: option.none
              },
              {
                type: 'readonly',
                key: 'updated_at',
                label: option.some(a18n`Last updated at`),
                content: formatDateTime(props.user.updated_at),
                description: option.none
              }
            ]}
          />
          <Buttons spacing="spread">
            <Button
              type="button"
              color="primary"
              label={a18n`Edit`}
              action={() => setIsEditing(true)}
              icon={option.none}
            />
            <Button
              type="button"
              label={a18n`Logout`}
              action={props.onLogout}
              icon={option.none}
              flat
            />
            <LoadingButton
              type="button"
              label={a18n`Delete profile`}
              color="danger"
              flat
              action={props.onDeleteProfile}
              icon={skull}
            />
          </Buttons>
        </Panel>
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
