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

export const DependentEntitySubject = t.union(
  [t.literal('new'), ObjectIdFromString],
  'DependentEntitySubject'
)
export type DependentEntitySubject = t.TypeOf<typeof DependentEntitySubject>

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

interface HomeRoute {
  readonly _tag: 'Home'
}

interface ClientsRoute {
  readonly _tag: 'Clients'
  readonly subject: RouteSubject
}

interface ProjectsRoute {
  readonly _tag: 'Projects'
  readonly subject: RouteSubject
}

interface TaskRoute {
  readonly _tag: 'Task'
  readonly project: ObjectIdFromString
  readonly subject: DependentEntitySubject
}

interface SessionRoute {
  readonly _tag: 'Session'
  readonly project: ObjectIdFromString
  readonly task: ObjectIdFromString
  readonly subject: ObjectIdFromString
}

interface SettingsRoute {
  readonly _tag: 'Settings'
}

interface CurrentSessionsRoute {
  readonly _tag: 'CurrentSessions'
}

interface InvoicesRoute {
  readonly _tag: 'Invoices'
}

interface StatsRoute {
  readonly _tag: 'Stats'
}

interface NotFoundRoute {
  readonly _tag: 'NotFound'
}

export type Location =
  | HomeRoute
  | ClientsRoute
  | ProjectsRoute
  | TaskRoute
  | SessionRoute
  | SettingsRoute
  | CurrentSessionsRoute
  | InvoicesRoute
  | StatsRoute
  | NotFoundRoute

export function homeRoute(): HomeRoute {
  return { _tag: 'Home' }
}

export function clientsRoute(subject: RouteSubject): ClientsRoute {
  return {
    _tag: 'Clients',
    subject
  }
}

export function projectsRoute(subject: RouteSubject): ProjectsRoute {
  return {
    _tag: 'Projects',
    subject
  }
}

export function taskRoute(
  project: ObjectIdFromString,
  subject: DependentEntitySubject
): TaskRoute {
  return {
    _tag: 'Task',
    project,
    subject
  }
}

export function sessionRoute(
  project: ObjectIdFromString,
  task: ObjectIdFromString,
  subject: ObjectIdFromString
): SessionRoute {
  return {
    _tag: 'Session',
    project,
    task,
    subject
  }
}

export function currentSessionsRoute(): CurrentSessionsRoute {
  return { _tag: 'CurrentSessions' }
}

export function settingsRoute(): SettingsRoute {
  return { _tag: 'Settings' }
}

export function invoicesRoute(): InvoicesRoute {
  return { _tag: 'Invoices' }
}

export function statsRoute(): StatsRoute {
  return { _tag: 'Stats' }
}

function notFoundRoute(): NotFoundRoute {
  return { _tag: 'NotFound' }
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

export function isTaskRoute(location: Location): boolean {
  return location._tag === 'Task'
}

export function isSessionRoute(location: Location): boolean {
  return location._tag === 'Session'
}

export function isSettingsRoute(location: Location): boolean {
  return location._tag === 'Settings'
}

export function isCurrentSessionsRoute(location: Location): boolean {
  return location._tag === 'CurrentSessions'
}

export function isInvoicesRoute(location: Location): boolean {
  return location._tag === 'Invoices'
}

export function isStatsRoute(location: Location): boolean {
  return location._tag === 'Stats'
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

const taskMatch = lit('projects')
  .then(type('project', ObjectIdFromString))
  .then(lit('tasks'))
  .then(type('subject', DependentEntitySubject))
  .then(end)

const sessionMatch = lit('projects')
  .then(type('project', ObjectIdFromString))
  .then(lit('tasks'))
  .then(type('task', ObjectIdFromString))
  .then(lit('sessions'))
  .then(type('subject', ObjectIdFromString))
  .then(end)

const invoicesMatch = lit('invoices')
const settingsMatch = lit('settings').then(end)
const currentSessionsMatch = lit('current-sessions').then(end)
const statsMatch = lit('stats')
const notFoundMatch = lit('not-found')

const router = zero<Location>()
  .alt(homeMatch.parser.map(homeRoute))
  .alt(clientsMatch.parser.map(({ subject }) => clientsRoute(subject)))
  .alt(projectsMatch.parser.map(({ subject }) => projectsRoute(subject)))
  .alt(
    taskMatch.parser.map(({ project, subject }) => taskRoute(project, subject))
  )
  .alt(
    sessionMatch.parser.map(({ project, task, subject }) =>
      sessionRoute(project, task, subject)
    )
  )
  .alt(settingsMatch.parser.map(() => settingsRoute()))
  .alt(currentSessionsMatch.parser.map(() => currentSessionsRoute()))
  .alt(invoicesMatch.parser.map(() => invoicesRoute()))
  .alt(statsMatch.parser.map(() => statsRoute()))

interface Props {
  render: (location: Location) => JSX.Element
}

function parseCurrentPath() {
  return parse(router, Route.parse(window.location.pathname), notFoundRoute())
}

function formatLocation(location: Location): string {
  return pipe(
    location,
    foldLocation({
      Home: location => format(homeMatch.formatter, location),
      Clients: location => format(clientsMatch.formatter, location),
      Projects: location => format(projectsMatch.formatter, location),
      Task: location => format(taskMatch.formatter, location),
      Session: location => format(sessionMatch.formatter, location),
      Settings: location => format(settingsMatch.formatter, location),
      CurrentSessions: location =>
        format(currentSessionsMatch.formatter, location),
      Invoices: location => format(invoicesMatch.formatter, location),
      Stats: location => format(statsMatch.formatter, location),
      NotFound: location => format(notFoundMatch.formatter, location)
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
  setRoute: (location: Location, newTab: boolean) => void
}

export function useRouter(): UseRouterOutput {
  const { location, setLocation } = useContext(LocationContext)

  const setRoute = (location: Location, newTab: boolean) => {
    const url = formatLocation(location)

    if (newTab) {
      window.open(url, '_blank')
    } else {
      setLocation(location)
      window.history.pushState(null, '', url)
    }
  }

  return {
    route: location,
    setRoute
  }
}
