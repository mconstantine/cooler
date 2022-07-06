import { end, format, lit, parse, Route, type, zero } from 'fp-ts-routing'
import { Reader } from 'fp-ts/Reader'
import { createContext, useContext, useEffect, useState } from 'react'
import { constVoid, pipe } from 'fp-ts/function'
import { ObjectId, ObjectIdFromString } from '../globalDomain'
import { IO } from 'fp-ts/IO'
import * as t from 'io-ts'

const RouteSubjectKey = t.keyof(
  {
    all: true,
    new: true
  },
  'RouteSubjectKey'
)

export const RouteSubject = t.union(
  [RouteSubjectKey, ObjectIdFromString],
  'RouteSubject'
)
export type RouteSubject = t.TypeOf<typeof RouteSubject>

export function foldRouteSubject<T>(
  whenAll: IO<T>,
  whenNew: IO<T>,
  whenDetails: Reader<ObjectId, T>
): Reader<RouteSubject, T> {
  return subject => {
    switch (subject) {
      case 'all':
        return whenAll()
      case 'new':
        return whenNew()
      default:
        return whenDetails(subject)
    }
  }
}

interface Home {
  readonly _tag: 'Home'
}

interface Clients {
  readonly _tag: 'Clients'
  readonly subject: RouteSubject
}

interface Projects {
  readonly _tag: 'Projects'
  readonly subject: RouteSubject
}

interface Tasks {
  readonly _tag: 'Tasks'
  readonly subject: RouteSubject
}

interface Settings {
  readonly _tag: 'Settings'
}

export type Location = Home | Clients | Projects | Tasks | Settings

export function homeRoute(): Home {
  return {
    _tag: 'Home'
  }
}

export function clientsRoute(subject: RouteSubject): Clients {
  return {
    _tag: 'Clients',
    subject
  }
}

export function projectsRoute(subject: RouteSubject): Projects {
  return {
    _tag: 'Projects',
    subject
  }
}

export function tasksRoute(subject: RouteSubject): Tasks {
  return {
    _tag: 'Tasks',
    subject
  }
}

export function settingsRoute(): Settings {
  return {
    _tag: 'Settings'
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

export function isTasksRoute(location: Location): boolean {
  return location._tag === 'Tasks'
}

export function isSettingsRoute(location: Location): boolean {
  return location._tag === 'Settings'
}

export function foldLocation<T>(matches: {
  [K in Location['_tag']]: (
    args: Omit<Extract<Location, { _tag: K }>, '_tag'>
  ) => T
}): (location: Location) => T {
  return location => matches[location._tag](location as any)
}

const homeMatch = end

const clientsMatch = lit('clients')
  .then(type('subject', RouteSubject))
  .then(end)

const projectsMatch = lit('projects')
  .then(type('subject', RouteSubject))
  .then(end)

const tasksMatch = lit('tasks').then(type('subject', RouteSubject)).then(end)
const settingsMatch = lit('settings').then(end)

const router = zero<Location>()
  .alt(homeMatch.parser.map(homeRoute))
  .alt(clientsMatch.parser.map(({ subject }) => clientsRoute(subject)))
  .alt(projectsMatch.parser.map(({ subject }) => projectsRoute(subject)))
  .alt(tasksMatch.parser.map(({ subject }) => tasksRoute(subject)))
  .alt(settingsMatch.parser.map(() => settingsRoute()))

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
      Projects: location => format(projectsMatch.formatter, location),
      Tasks: location => format(tasksMatch.formatter, location),
      Settings: location => format(settingsMatch.formatter, location)
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

export function Router(props: Props) {
  const [location, setLocation] = useState<Location>(parseCurrentPath())

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
      {props.render(location)}
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
