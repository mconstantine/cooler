import { Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Cooler } from './components/Cooler/Cooler'
import { foldLocation, Router } from './components/Router'
import { LoadingBlock } from './components/Loading/LoadingBlock'
import { AccountProvider } from './contexts/AccountContext'
import { ConfigProvider } from './contexts/ConfigContext'

// const ProfilePage = lazy(
//   () => import('./components/Pages/Profile/ProfilePage/ProfilePage')
// )

// const ClientsPage = lazy(() => import('./components/Pages/Client/ClientsPage'))

// const ProjectsPage = lazy(
//   () => import('./components/Pages/Project/ProjectsPage')
// )

export function App() {
  return (
    <ConfigProvider>
      <ThemeProvider>
        <Cooler>
          <AccountProvider>
            <Suspense fallback={<LoadingBlock />}>
              <Router
                render={foldLocation({
                  // Home: () => <ProfilePage />,
                  // Clients: ({ subject }) => <ClientsPage subject={subject} />,
                  // Projects: ({ subject }) => <ProjectsPage subject={subject} />
                  Home: () => <p>Home</p>,
                  Clients: () => <p>Clients</p>,
                  Projects: () => <p>Projects</p>
                })}
              />
            </Suspense>
          </AccountProvider>
        </Cooler>
      </ThemeProvider>
    </ConfigProvider>
  )
}
