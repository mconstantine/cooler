import { boolean, option, readerTaskEither, taskEither } from 'fp-ts'
import { constNull, flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Option } from 'fp-ts/Option'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { skull } from 'ionicons/icons'
import { useState } from 'react'
import { a18n, formatDateTime } from '../../a18n'
import { Button } from '../../components/Button/Button/Button'
import { Buttons } from '../../components/Button/Buttons/Buttons'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { UserForm } from '../../components/Form/Forms/UserForm'
import { ReadOnlyInput } from '../../components/Form/Input/ReadOnlyInput/ReadOnlyInput'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { query } from '../../effects/api/api'
import { Query } from '../../effects/api/Query'
import { useDialog } from '../../effects/useDialog'
import { LocalizedString } from '../../globalDomain'
import { Profile, ProfileUpdateInput } from './domain'

interface Props {
  profile: Query<LocalizedString, Profile>
  onUpdate: ReaderTaskEither<ProfileUpdateInput, LocalizedString, void>
  onDelete: ReaderTaskEither<void, LocalizedString, unknown>
  onLogout: IO<void>
}

export function ProfileData(props: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const [Dialog, deleteProfile] = useDialog<void, void, unknown>(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(props.onDelete),
        taskEither.mapLeft(flow(option.some, setError))
      ),
    {
      title: () => a18n`Are you sure you want to delete your account?`,
      message: () =>
        a18n`All your data, clients, projects, tasks and sessions will be deleted!`
    }
  )

  const onSubmit: ReaderTaskEither<ProfileUpdateInput, LocalizedString, void> =
    flow(
      props.onUpdate,
      taskEither.chain(readerTaskEither.fromIO(() => setIsEditing(false)))
    )

  const onCancel = () => setIsEditing(false)

  return pipe(
    props.profile,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      profile =>
        pipe(
          isEditing,
          boolean.fold(
            () => (
              <Panel title={a18n`Your data`} framed action={option.none}>
                <ReadOnlyInput
                  name="name"
                  label={a18n`Name`}
                  value={profile.name}
                />
                <ReadOnlyInput
                  name="email"
                  label={a18n`E-mail address`}
                  value={profile.email as unknown as LocalizedString}
                />
                <ReadOnlyInput
                  name="created_at"
                  label={a18n`Created at`}
                  value={formatDateTime(profile.createdAt)}
                />
                <ReadOnlyInput
                  name="updated_at"
                  label={a18n`Last updated at`}
                  value={formatDateTime(profile.updatedAt)}
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
                    action={deleteProfile()}
                    icon={skull}
                  />
                </Buttons>
                <Dialog />
              </Panel>
            ),
            () => (
              <UserForm
                user={profile}
                onSubmit={onSubmit}
                onCancel={onCancel}
              />
            )
          )
        )
    )
  )
}
