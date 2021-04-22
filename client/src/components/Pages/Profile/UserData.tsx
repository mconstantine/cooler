import { boolean, option, taskEither } from 'fp-ts'
import { constNull, flow, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { FC, useState } from 'react'
import { a18n, formatDateTime } from '../../../a18n'
import { LocalizedString } from '../../../globalDomain'
import { Option } from 'fp-ts/Option'
import { Panel } from '../../Panel/Panel'
import { Buttons } from '../../Button/Buttons/Buttons'
import { Button } from '../../Button/Button/Button'
import { LoadingButton } from '../../Button/LoadingButton/LoadingButton'
import { skull } from 'ionicons/icons'
import { UserForm } from '../../Form/Forms/UserForm'
import { useDialog } from '../../../effects/useDialog'
import { User } from '../../../entities/User'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { IO } from 'fp-ts/IO'
import { ReadOnlyInput } from '../../Form/Input/ReadOnlyInput/ReadOnlyInput'
import { ErrorPanel } from '../../ErrorPanel/ErrorPanel'

export interface UserUpdate extends Pick<User, 'name' | 'email'> {
  password: Option<NonEmptyString>
}

interface Props {
  user: User
  onDataChange: ReaderTaskEither<UserUpdate, LocalizedString, unknown>
  onLogout: IO<void>
  onDeleteProfile: TaskEither<LocalizedString, unknown>
}

export const UserData: FC<Props> = props => {
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const onSubmit = flow(
    props.onDataChange,
    taskEither.chain(() => taskEither.fromIO(() => setIsEditing(false)))
  )

  const onCancel = () => setIsEditing(false)

  const [Dialog, deleteProfile] = useDialog(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(() => props.onDeleteProfile),
        taskEither.mapLeft(flow(option.some, setError))
      ),
    {
      title: () => a18n`Are you sure you want to delete your account?`,
      message: () =>
        a18n`All your data, clients, projects, tasks and sessions will be deleted!`
    }
  )

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel title={a18n`Your data`} framed action={option.none}>
          <ReadOnlyInput
            name="name"
            label={a18n`Name`}
            value={props.user.name}
          />
          <ReadOnlyInput
            name="email"
            label={a18n`E-mail address`}
            value={(props.user.email as unknown) as LocalizedString}
          />
          <ReadOnlyInput
            name="created_at"
            label={a18n`Created at`}
            value={formatDateTime(props.user.created_at)}
          />
          <ReadOnlyInput
            name="updated_at"
            label={a18n`Last updated at`}
            value={formatDateTime(props.user.updated_at)}
          />
          {pipe(
            error,
            option.fold(constNull, error => <ErrorPanel error={error} />)
          )}
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
              action={deleteProfile(null)}
              icon={skull}
            />
          </Buttons>
          <Dialog />
        </Panel>
      ),
      () => (
        <UserForm user={props.user} onSubmit={onSubmit} onCancel={onCancel} />
      )
    )
  )
}
