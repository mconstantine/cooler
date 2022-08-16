import { boolean, option, readerTaskEither, taskEither } from 'fp-ts'
import { constNull, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { skull } from 'ionicons/icons'
import { useEffect, useState } from 'react'
import { a18n, formatDateTime } from '../../a18n'
import { Button } from '../../components/Button/Button/Button'
import { Buttons } from '../../components/Button/Buttons/Buttons'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { UserForm } from '../../components/Form/Forms/UserForm'
import { ReadOnlyInput } from '../../components/Form/Input/ReadOnlyInput/ReadOnlyInput'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { Panel } from '../../components/Panel/Panel'
import { useAccount } from '../../contexts/AccountContext'
import { query } from '../../effects/api/api'
import { useDelete, usePut, useReactiveCommand } from '../../effects/api/useApi'
import { useDialog } from '../../effects/useDialog'
import { LocalizedString } from '../../globalDomain'
import {
  deleteProfileRequest,
  getProfileRequest,
  ProfileUpdateInput,
  updateProfileRequest
} from './domain'

export function ProfileData() {
  const { logout } = useAccount()

  const [profile, setProfile, getProfile] =
    useReactiveCommand(getProfileRequest)

  const updateProfileCommand = usePut(updateProfileRequest)
  const deleteProfileCommand = useDelete(deleteProfileRequest)

  const onUpdate: ReaderTaskEither<ProfileUpdateInput, LocalizedString, void> =
    pipe(updateProfileCommand, readerTaskEither.map(setProfile))

  const onDelete: ReaderTaskEither<void, LocalizedString, void> = pipe(
    deleteProfileCommand,
    readerTaskEither.map(logout)
  )

  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  const [Dialog, deleteProfile] = useDialog<void, void, void>(
    () =>
      pipe(
        taskEither.rightIO(() => setError(option.none)),
        taskEither.chain(onDelete),
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
      onUpdate,
      taskEither.chain(readerTaskEither.fromIO(() => setIsEditing(false)))
    )

  const onCancel = () => setIsEditing(false)

  useEffect(() => {
    getProfile()()
  }, [getProfile])

  return pipe(
    profile,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      profile =>
        pipe(
          isEditing,
          boolean.fold(
            () => (
              <Panel title={a18n`Your data`} framed actions={option.none}>
                <ReadOnlyInput
                  name="name"
                  label={a18n`Name`}
                  value={profile.name}
                  action={option.none}
                />
                <ReadOnlyInput
                  name="email"
                  label={a18n`E-mail address`}
                  value={profile.email as unknown as LocalizedString}
                  action={option.none}
                />
                <ReadOnlyInput
                  name="created_at"
                  label={a18n`Created at`}
                  value={formatDateTime(profile.createdAt)}
                  action={option.none}
                />
                <ReadOnlyInput
                  name="updated_at"
                  label={a18n`Last updated at`}
                  value={formatDateTime(profile.updatedAt)}
                  action={option.none}
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
                    action={logout}
                    icon={option.none}
                    flat
                  />
                  <LoadingButton
                    type="loadingButton"
                    label={option.some(a18n`Delete profile`)}
                    color="danger"
                    flat
                    action={_ => deleteProfile()}
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
