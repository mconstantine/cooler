import { readerTaskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useEffect } from 'react'
import { useAccount } from '../../contexts/AccountContext'
import { TaxesProvider } from '../../contexts/TaxesContext'
import { useDelete, usePut, useReactiveCommand } from '../../effects/api/useApi'
import { LocalizedString } from '../../globalDomain'
import {
  deleteProfileRequest,
  getProfileRequest,
  ProfileUpdateInput,
  updateProfileRequest
} from './domain'
// import { CashedBalance } from './CashedBalance'
// import { LatestProjects } from './LatestProjects'
import { ProfileData } from './ProfileData'
// import { ProfileStats } from './ProfileStats'
// import { TasksDueToday } from './TasksDueToday'

export default function ProfilePage() {
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

  useEffect(() => {
    getProfile()()
  }, [getProfile])

  return (
    <TaxesProvider>
      <ProfileData
        profile={profile}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onLogout={logout}
      />
      {/* <ProfileStats /> */}
      {/* <CashedBalance /> */}
      {/* <TasksDueToday /> */}
      {/* <LatestProjects /> */}
    </TaxesProvider>
  )
}
