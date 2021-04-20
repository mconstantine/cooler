import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { TaskEither } from 'fp-ts/TaskEither'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { FC } from 'react'
import { useAccount } from '../../../../contexts/AccountContext'
import { useMutation } from '../../../../effects/useMutation'
import { foldQuery, UseQueryOutput } from '../../../../effects/useQuery'
import { LocalizedString } from '../../../../globalDomain'
import { UserUpdate } from '../../../Form/Forms/UserForm'
import {
  deleteProfileMutation,
  updateProfileMutation,
  ProfileQueryInput,
  ProfileQueryOutput
} from './domain'
import { LoadingBlock } from '../../../Loading/LoadingBlock'
import { ErrorPanel } from '../../../ErrorPanel'
import { getConnectionNodes } from '../../../../misc/graphql'
import { UserData } from '../UserData'
import { CurrentSituation } from '../CurrentSituation'
import { CashedAmount } from '../CashedAmount'
import { Reader } from 'fp-ts/Reader'

interface Props {
  query: UseQueryOutput<ProfileQueryInput, ProfileQueryOutput>
  queryInput: ProfileQueryInput
  onQueryInputChange: Reader<ProfileQueryInput, unknown>
}

export const Profile: FC<Props> = props => {
  const { query: profile, update } = props.query
  const { dispatch } = useAccount()
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
          update(({ me }) => ({
            me: {
              ...me,
              ...updateMe
            }
          }))
        )
      ),
      taskEither.mapLeft(error => error.message)
    )

  const onLogout: IO<void> = () => dispatch({ type: 'logout' })

  const onDeleteProfile: TaskEither<LocalizedString, unknown> = pipe(
    deleteProfile(),
    taskEither.mapLeft(error => error.message)
  )

  return pipe(
    profile,
    foldQuery(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error.message} />,
      data => {
        const taxes = getConnectionNodes(data.me.taxes)

        return (
          <>
            <UserData
              user={{ ...data.me, taxes }}
              onDataChange={onDataChange}
              onLogout={onLogout}
              onDeleteProfile={onDeleteProfile}
            />
            <CurrentSituation
              data={{ ...data.me, taxes }}
              since={props.queryInput.since}
              onSinceDateChange={since =>
                taskEither.fromIO(() => props.onQueryInputChange({ since }))
              }
            />
            <CashedAmount
              data={{ ...data.me, taxes }}
              since={props.queryInput.since}
              onSinceDateChange={since =>
                taskEither.fromIO(() => props.onQueryInputChange({ since }))
              }
            />
          </>
        )
      }
    )
  )
}
