import { lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Cooler } from './components/Cooler/Cooler'
import { foldLocation, Router } from './components/Router'
import { LoadingBlock } from './components/Loading/LoadingBlock'
import { AccountProvider } from './contexts/AccountContext'
import { pipe } from 'fp-ts/function'
import { Menu } from './components/Menu/Menu'
import { Content } from './components/Content/Content'

const Clients = lazy(() => import('./pages/Clients/Clients'))
const Projects = lazy(() => import('./pages/Projects/Projects'))
const Profile = lazy(() => import('./pages/Profile/Profile'))
const Settings = lazy(() => import('./pages/Settings/Settings'))
const Tasks = lazy(() => import('./pages/Tasks/Tasks'))

export function App() {
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
                        Tasks: ({ subject }) => (
                          <Tasks routeSubject={subject} />
                        ),
                        Settings: () => <Settings />
                      })
                    )}
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
