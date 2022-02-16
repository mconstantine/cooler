import { readerTaskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useEffect } from 'react'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { useAccount } from '../../contexts/AccountContext'
import { query } from '../../effects/api/api'
import { useDelete, usePut, useReactiveCommand } from '../../effects/api/useApi'
import { LocalizedString } from '../../globalDomain'
import {
  deleteProfileRequest,
  getProfileRequest,
  ProfileUpdateInput,
  updateProfileRequest
} from './domain'
import { ProfileData } from './ProfileData'

export default function ProfilePage() {
  const { logout } = useAccount()
  const [profile, setProfile, getProfile] =
    useReactiveCommand(getProfileRequest)
  const updateProfile = usePut(updateProfileRequest)
  const deleteProfile = useDelete(deleteProfileRequest)

  const onUpdate: ReaderTaskEither<ProfileUpdateInput, LocalizedString, void> =
    pipe(
      updateProfile,
      readerTaskEither.bimap(error => error.message, setProfile)
    )

  const onDelete: ReaderTaskEither<void, LocalizedString, void> = pipe(
    deleteProfile,
    readerTaskEither.bimap(error => error.message, logout)
  )

  useEffect(() => {
    getProfile()()
  }, [getProfile])

  return pipe(
    profile,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error.message} />,
      profile => (
        <ProfileData
          profile={profile}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onLogout={logout}
        />
      )
    )
  )
}
