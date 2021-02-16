import { end, format, lit, parse, Route, zero } from 'fp-ts-routing'
import { Reader } from 'fp-ts/Reader'
import { IO } from 'fp-ts/IO'
import { createContext, FC, lazy, useContext, useEffect, useState } from 'react'
import { constVoid, pipe } from 'fp-ts/function'
import { foldAccount, useAccount } from '../contexts/AccountContext'

const LoginPage = lazy(() => import('./Pages/Login/LoginPage'))

interface Home {
  readonly _tag: 'Home'
}

interface Clients {
  readonly _tag: 'Clients'
}

interface Projects {
  readonly _tag: 'Projects'
}

interface Profile {
  readonly _tag: 'Profile'
}

export type Location = Home | Clients | Projects | Profile

export function home(): Home {
  return {
    _tag: 'Home'
  }
}

export function clients(): Clients {
  return {
    _tag: 'Clients'
  }
}

export function projects(): Projects {
  return {
    _tag: 'Projects'
  }
}

export function profile(): Profile {
  return {
    _tag: 'Profile'
  }
}

export function foldLocation<T>(
  matches: {
    [K in Location['_tag']]: (
      args: Omit<Extract<Location, { _tag: K }>, '_tag'>
    ) => T
  }
): (location: Location) => T {
  return location => matches[location._tag](location)
}

const homeMatch = end
const clientsMatch = lit('clients').then(end)
const projectsMatch = lit('projects').then(end)
const profileMatch = lit('profile').then(end)

const router = zero<Location>()
  .alt(homeMatch.parser.map(home))
  .alt(clientsMatch.parser.map(clients))
  .alt(projectsMatch.parser.map(projects))
  .alt(profileMatch.parser.map(profile))

interface Props {
  render: (location: Location) => JSX.Element
}

function parseCurrentPath() {
  return parse(router, Route.parse(window.location.pathname), home())
}

function formatLocation(location: Location): string {
  return format(
    pipe(
      location,
      foldLocation({
        Home: () => homeMatch.formatter,
        Clients: () => clientsMatch.formatter,
        Projects: () => projectsMatch.formatter,
        Profile: () => profileMatch.formatter
      })
    ),
    location
  )
}

interface LocationContext {
  location: Location
  setLocation: Reader<Location, void>
}

const LocationContext = createContext<LocationContext>({
  location: home(),
  setLocation: constVoid
})

export const Router: FC<Props> = props => {
  const [location, setLocation] = useState<Location>(parseCurrentPath())
  const { account } = useAccount()

  useEffect(() => {
    const onRouteChange = () => {
      setLocation(parseCurrentPath())
    }

    window.addEventListener('popstate', onRouteChange)

    return () => {
      window.removeEventListener('popstate', onRouteChange)
    }
  }, [])

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {pipe(
        account,
        foldAccount(
          () => <LoginPage />,
          () => props.render(location)
        )
      )}
    </LocationContext.Provider>
  )
}

interface UseRouterOutput {
  getRoute: IO<Location>
  setRoute: Reader<Location, void>
}

export function useRouter(): UseRouterOutput {
  const { location, setLocation } = useContext(LocationContext)
  const getRoute = () => location

  const setRoute = (location: Location) => {
    setLocation(location)
    window.history.pushState(null, '', formatLocation(location))
  }

  return {
    getRoute,
    setRoute
  }
}
