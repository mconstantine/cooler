import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { person, settings } from 'ionicons/icons'
import { useState } from 'react'
import { a18n } from '../../../../a18n'
import { useQuery } from '../../../../effects/useQuery'
import { Content } from '../../../Content/Content'
import { Heading } from '../../../Heading/Heading'
import { Menu } from '../../../Menu/Menu'
import { profileQuery, ProfileQueryInput } from './domain'
import { Profile } from './Profile'
import { Settings } from './Settings'

type View = 'Profile' | 'Settings'

function foldView<T>(matches: { [k in View]: IO<T> }): Reader<View, T> {
  return view => matches[view]()
}

export default function ProfilePage() {
  const [view, setView] = useState<View>('Profile')
  const [queryInput, setQueryInput] = useState<ProfileQueryInput>(() => {
    const now = new Date()
    return { since: new Date(now.getFullYear(), now.getMonth()) }
  })

  const query = useQuery(profileQuery, queryInput)

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
                <Profile
                  query={query}
                  queryInput={queryInput}
                  onQueryInputChange={setQueryInput}
                />
              </>
            ),
            Settings: () => (
              <>
                <Heading
                  size={40}
                  action={option.some({
                    type: 'sync',
                    label: a18n`Profile`,
                    icon: option.some(person),
                    action: () => setView('Profile')
                  })}
                >
                  {a18n`Settings`}
                </Heading>
                <Settings query={query} />
              </>
            )
          })
        )}
      </Content>
    </div>
  )
}
