import { end, format, lit, parse, Route, type, zero } from 'fp-ts-routing'
import { Reader } from 'fp-ts/Reader'
import { createContext, FC, lazy, useContext, useEffect, useState } from 'react'
import { constVoid, pipe } from 'fp-ts/function'
import { foldAccount, useAccount } from '../contexts/AccountContext'
import { ClientSubject } from './Pages/Client/domain'

const LoginPage = lazy(() => import('./Pages/Login/LoginPage'))

interface Home {
  readonly _tag: 'Home'
}

interface Clients {
  readonly _tag: 'Clients'
  readonly subject: ClientSubject
}

interface Projects {
  readonly _tag: 'Projects'
}

export type Location = Home | Clients | Projects

export function homeRoute(): Home {
  return {
    _tag: 'Home'
  }
}

export function clientsRoute(subject: ClientSubject): Clients {
  return {
    _tag: 'Clients',
    subject
  }
}

export function projectsRoute(): Projects {
  return {
    _tag: 'Projects'
  }
}

export function isHomeRoute(location: Location): boolean {
  return location._tag === 'Home'
}

export function isClientsRoute(location: Location): boolean {
  return location._tag === 'Clients'
}

export function isProjectsRoute(location: Location): boolean {
  return location._tag === 'Projects'
}

export function foldLocation<T>(
  matches: {
    [K in Location['_tag']]: (
      args: Omit<Extract<Location, { _tag: K }>, '_tag'>
    ) => T
  }
): (location: Location) => T {
  return location => matches[location._tag](location as any)
}

const homeMatch = end
const clientsMatch = lit('clients')
  .then(type('subject', ClientSubject))
  .then(end)
const projectsMatch = lit('projects').then(end)

const router = zero<Location>()
  .alt(homeMatch.parser.map(homeRoute))
  .alt(clientsMatch.parser.map(({ subject }) => clientsRoute(subject)))
  .alt(projectsMatch.parser.map(projectsRoute))

interface Props {
  render: (location: Location) => JSX.Element
}

function parseCurrentPath() {
  return parse(router, Route.parse(window.location.pathname), homeRoute())
}

function formatLocation(location: Location): string {
  return pipe(
    location,
    foldLocation({
      Home: location => format(homeMatch.formatter, location),
      Clients: location => format(clientsMatch.formatter, location),
      Projects: location => format(projectsMatch.formatter, location)
    })
  )
}

interface LocationContext {
  location: Location
  setLocation: Reader<Location, void>
}

const LocationContext = createContext<LocationContext>({
  location: homeRoute(),
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
  route: Location
  setRoute: Reader<Location, void>
}

export function useRouter(): UseRouterOutput {
  const { location, setLocation } = useContext(LocationContext)

  const setRoute = (location: Location) => {
    setLocation(location)
    window.history.pushState(null, '', formatLocation(location))
  }

  return {
    route: location,
    setRoute
  }
}
