import { option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { TaskEither } from 'fp-ts/TaskEither'
import { settings } from 'ionicons/icons'
import { useMemo, useState } from 'react'
import { a18n } from '../../../../a18n'
import { useAccount } from '../../../../contexts/AccountContext'
import { useMutation } from '../../../../effects/useMutation'
import { foldQuery, useQuery } from '../../../../effects/useQuery'
import { LocalizedString } from '../../../../globalDomain'
import { getConnectionNodes } from '../../../../misc/graphql'
import { Content } from '../../../Content/Content'
import { ErrorPanel } from '../../../ErrorPanel'
import { Heading } from '../../../Heading/Heading'
import { LoadingBlock } from '../../../Loading/LoadingBlock'
import { Menu } from '../../../Menu/Menu'
import { CashedAmount } from '../CashedAmount'
import { CurrentSituation } from '../CurrentSituation'
import { UserData, UserUpdate } from '../UserData'
import {
  deleteProfileMutation,
  profileQuery,
  updateProfileMutation
} from './domain'

type View = 'Profile' | 'Settings'

function foldView<T>(matches: { [k in View]: IO<T> }): Reader<View, T> {
  return view => matches[view]()
}

export default function ProfilePage() {
  const { dispatch } = useAccount()
  const updateProfile = useMutation(updateProfileMutation)
  const deleteProfile = useMutation(deleteProfileMutation)
  const [view, setView] = useState<View>('Profile')

  const [since, setSince] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth())
  })

  const input = useMemo(() => ({ since }), [since])
  const [profile, , update] = useQuery(profileQuery, input)

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
          view,
          foldView({
            Profile: () => (
              <>
                <Heading
                  size={40}
                  action={option.some({
                    type: 'sync',
                    label: a18n`Settings`,
                    icon: option.some(settings),
                    action: () => setView('Settings')
                  })}
                >
                  {a18n`Profile`}
                </Heading>
                {pipe(
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
                            since={since}
                            onSinceDateChange={since =>
                              taskEither.fromIO(() => setSince(since))
                            }
                          />
                          <CashedAmount
                            data={{ ...data.me, taxes }}
                            since={since}
                            onSinceDateChange={since =>
                              taskEither.fromIO(() => setSince(since))
                            }
                          />
                        </>
                      )
                    }
                  )
                )}
              </>
            ),
            Settings: () => null // TODO: settings page here
          })
        )}
      </Content>
    </div>
  )
}
