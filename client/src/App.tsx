import { FC, lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Cooler } from './components/Cooler/Cooler'
import { foldLocation, Router } from './components/Router'
import { LoadingBlock } from './components/Loading/LoadingBlock'

const ProfilePage = lazy(() => import('./components/Pages/Profile/ProfilePage'))
const ClientsPage = lazy(() => import('./components/Pages/Client/ClientsPage'))

const ProjectsPage = lazy(
  () => import('./components/Pages/Project/ProjectsPage')
)

interface Props {}

export const App: FC<Props> = () => {
  return (
    <ThemeProvider>
      <Cooler>
        <Suspense fallback={<LoadingBlock />}>
          <Router
            render={foldLocation({
              Home: () => <ProfilePage />,
              Clients: () => <ClientsPage />,
              Projects: () => <ProjectsPage />,
              Profile: () => <ProfilePage />
            })}
          />
        </Suspense>
      </Cooler>
    </ThemeProvider>
  )
}
