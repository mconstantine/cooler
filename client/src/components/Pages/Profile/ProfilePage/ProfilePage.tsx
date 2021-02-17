import { useQuery, foldQuery } from '../../../../effects/useQuery'
import { Content } from '../../../Content/Content'
import { Menu } from '../../../Menu/Menu'
import {
  deleteProfileMutation,
  profileQuery,
  ProfileQueryOutput,
  updateProfileMutation,
  UpdateProfileMutationInput,
  UpdateProfileMutationOutput
} from './domain'
import * as t from 'io-ts'
import { pipe } from 'fp-ts/function'
import { LoadingBlock } from '../../../Loading/LoadingBlock'
import { Body } from '../../../Body/Body'
import { getGraphQLError } from '../../../../misc/getGraphQLError'
import { UserData, UserUpdate } from '../UserData'
import { option, taskEither } from 'fp-ts'
import { commonErrors } from '../../../../misc/commonErrors'
import { getConnectionNodes } from '../../../../misc/graphql'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { LocalizedString } from '../../../../globalDomain'
import { TaskEither } from 'fp-ts/TaskEither'
import { IO } from 'fp-ts/IO'
import { ErrorPanel } from '../../../ErrorPanel'
import { useMutation } from '../../../../effects/useMutation'
import { useAccount } from '../../../../contexts/AccountContext'

export default function ProfilePage() {
  const { dispatch } = useAccount()

  const profile = useQuery(
    profileQuery,
    { variables: void 0 },
    t.void,
    ProfileQueryOutput
  )

  const [updateProfile] = useMutation(
    updateProfileMutation,
    option.none,
    UpdateProfileMutationInput,
    UpdateProfileMutationOutput
  )

  const [deleteProfile] = useMutation(
    deleteProfileMutation,
    option.none,
    t.void,
    t.void
  )

  const onLogout: IO<void> = () =>
    dispatch({
      type: 'logout'
    })

  const onDataChange: ReaderTaskEither<
    UserUpdate,
    LocalizedString,
    unknown
  > = user =>
    pipe(
      updateProfile({
        variables: { user }
      }),
      taskEither.mapLeft(getGraphQLError),
      taskEither.chain(() =>
        taskEither.fromIO(() => option.isSome(user.password) && onLogout())
      )
    )

  const onDeleteProfile: TaskEither<LocalizedString, unknown> = pipe(
    deleteProfile({ variables: void 0 }),
    taskEither.mapLeft(getGraphQLError),
    taskEither.chain(() =>
      taskEither.fromIO(() =>
        dispatch({
          type: 'logout'
        })
      )
    )
  )

  return (
    <div className="ProfilePage">
      <Menu />
      <Content>
        {pipe(
          profile,
          foldQuery(
            () => <LoadingBlock />,
            error => <ErrorPanel error={getGraphQLError(error)} />,
            option.fold(
              () => <Body>{commonErrors.decode}</Body>,
              data => (
                <UserData
                  user={{
                    ...data.me,
                    taxes: getConnectionNodes(data.me.taxes)
                  }}
                  onDataChange={onDataChange}
                  onDeleteProfile={onDeleteProfile}
                  onLogout={onLogout}
                />
              )
            )
          )
        )}
      </Content>
    </div>
  )
}
