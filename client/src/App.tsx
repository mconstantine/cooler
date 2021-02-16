import { FC, lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Cooler } from './components/Cooler/Cooler'
import { foldLocation, Router } from './components/Router'
import { LoadingBlock } from './components/Loading/LoadingBlock'
import { AccountProvider } from './contexts/AccountContext'
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client'

const ProfilePage = lazy(() => import('./components/Pages/Profile/ProfilePage'))
const ClientsPage = lazy(() => import('./components/Pages/Client/ClientsPage'))

const ProjectsPage = lazy(
  () => import('./components/Pages/Project/ProjectsPage')
)

interface Props {}

export const App: FC<Props> = () => {
  const client = new ApolloClient({
    uri: process.env.REACT_APP_API_URL,
    cache: new InMemoryCache()
  })

  return (
    <ThemeProvider>
      <Cooler>
        <ApolloProvider client={client}>
          <AccountProvider>
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
          </AccountProvider>
        </ApolloProvider>
      </Cooler>
    </ThemeProvider>
  )
}
