import { taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { TaskEither } from 'fp-ts/TaskEither'
import { useAccount } from '../../../../contexts/AccountContext'
import { useMutation } from '../../../../effects/useMutation'
import { foldQuery, useQuery } from '../../../../effects/useQuery'
import { LocalizedString } from '../../../../globalDomain'
import { getConnectionNodes } from '../../../../misc/graphql'
import { Content } from '../../../Content/Content'
import { ErrorPanel } from '../../../ErrorPanel'
import { LoadingBlock } from '../../../Loading/LoadingBlock'
import { Menu } from '../../../Menu/Menu'
import { UserData, UserUpdate } from '../UserData'
import {
  deleteProfileMutation,
  profileQuery,
  updateProfileMutation
} from './domain'

export default function ProfilePage() {
  const { dispatch } = useAccount()
  const [profile, , update] = useQuery(profileQuery)
  const updateProfile = useMutation(updateProfileMutation)
  const deleteProfile = useMutation(deleteProfileMutation)

  const onDataChange: ReaderTaskEither<
    UserUpdate,
    LocalizedString,
    unknown
  > = user =>
    pipe(
      updateProfile({ user }),
      taskEither.chain(({ updateMe }) =>
        taskEither.fromIO(() =>
          pipe(
            profile,
            foldQuery(constVoid, constVoid, ({ me }) =>
              update({
                me: {
                  ...me,
                  ...updateMe
                }
              })
            )
          )
        )
      ),
      taskEither.mapLeft(error => error.message)
    )

  const onLogout: IO<void> = () => dispatch({ type: 'logout' })

  const onDeleteProfile: TaskEither<LocalizedString, unknown> = pipe(
    deleteProfile(),
    taskEither.mapLeft(error => error.message)
  )

  return (
    <div className="ProfilePage">
      <Menu />
      <Content>
        {pipe(
          profile,
          foldQuery(
            () => <LoadingBlock />,
            error => <ErrorPanel error={error.message} />,
            data => (
              <UserData
                user={{
                  ...data.me,
                  taxes: getConnectionNodes(data.me.taxes)
                }}
                onDataChange={onDataChange}
                onLogout={onLogout}
                onDeleteProfile={onDeleteProfile}
              />
            )
          )
        )}
      </Content>
    </div>
  )
}
