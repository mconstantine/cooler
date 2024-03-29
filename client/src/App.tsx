import { lazy, Suspense, useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Cooler } from './components/Cooler/Cooler'
import { foldLocation, Router } from './components/Router'
import { LoadingBlock } from './components/Loading/LoadingBlock'
import { AccountProvider } from './contexts/AccountContext'
import { pipe } from 'fp-ts/function'
import { Menu } from './components/Menu/Menu'
import { Content } from './components/Content/Content'
import { CurrentSessionsProvider } from './contexts/CurrentSessionsContext'
import { CurrentSessionsPanel } from './CurrentSessionsPanel'
import { CurrentSessions } from './pages/CurrentSessions/CurrentSessions'
import { useStorage } from './effects/useStorage'

const Clients = lazy(() => import('./pages/Clients/Clients'))
const Projects = lazy(() => import('./pages/Projects/Projects'))
const Profile = lazy(() => import('./pages/Profile/Profile'))
const Settings = lazy(() => import('./pages/Settings/Settings'))
const Tasks = lazy(() => import('./pages/Tasks/Tasks'))
const Session = lazy(() => import('./pages/Session/Session'))
const Invoices = lazy(() => import('./pages/Invoices/Invoices'))
const Stats = lazy(() => import('./pages/Stats/Stats'))
const NotFound = lazy(() => import('./pages/NotFound'))

export function App() {
  const { clearStorage } = useStorage()

  useEffect(() => {
    const onBeforeUnload = () => clearStorage('projectQueryFilters')

    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [clearStorage])

  return (
    <ThemeProvider>
      <Cooler>
        <AccountProvider>
          <Suspense fallback={<LoadingBlock />}>
            <Router
              render={location => (
                <>
                  <Menu />
                  <Content>
                    <CurrentSessionsProvider>
                      <CurrentSessionsPanel />
                      {pipe(
                        location,
                        foldLocation({
                          Home: () => <Profile />,
                          Clients: ({ subject }) => (
                            <Clients routeSubject={subject} />
                          ),
                          Projects: ({ subject }) => (
                            <Projects routeSubject={subject} />
                          ),
                          Task: ({ project, subject }) => (
                            <Tasks project={project} routeSubject={subject} />
                          ),
                          Session: ({ project, task, subject }) => (
                            <Session
                              projectId={project}
                              taskId={task}
                              _id={subject}
                            />
                          ),
                          Settings: () => <Settings />,
                          CurrentSessions: () => <CurrentSessions />,
                          Invoices: () => <Invoices />,
                          Stats: () => <Stats />,
                          NotFound: () => <NotFound />
                        })
                      )}
                    </CurrentSessionsProvider>
                  </Content>
                </>
              )}
            />
          </Suspense>
        </AccountProvider>
      </Cooler>
    </ThemeProvider>
  )
}
